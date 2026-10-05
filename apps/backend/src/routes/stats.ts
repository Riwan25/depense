import type { Prisma, TransactionBucket } from "@generated/prisma/client";
import { zValidator } from "@hono/zod-validator";
import { StatsByCategoryFilters$, StatsSeriesFilters$ } from "@repo/utils";
import { Hono } from "hono";

import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/middlewares/use-auth";
import { enumeratePeriods, monthsBetween, periodKey, periodStart } from "@/utils/stat-periods";

const BUCKET_LABELS: Record<TransactionBucket, string> = {
  MAIN: "Main",
  CHEQUE_REPAS: "Cheque repas",
  SAVINGS: "Savings",
};

const DEFAULT_BUCKETS: TransactionBucket[] = ["MAIN", "CHEQUE_REPAS"];

function dateFilter(from?: Date, to?: Date): Prisma.TransactionWhereInput {
  if (!from && !to) return {};
  return { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } };
}

export const statsRoutes = new Hono()
  .use(isAuthenticated)
  .get("/by-category", zValidator("query", StatsByCategoryFilters$), async (c) => {
    const user = c.get("user")!;
    const { from, to, categoryIds, buckets, flow, average } = c.req.valid("query");
    const selectedIds = new Set(categoryIds ?? []);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        isPositive: flow === "INCOME",
        bucket: { in: buckets?.length ? buckets : DEFAULT_BUCKETS },
        ...dateFilter(from, to),
      },
      select: {
        value: true,
        date: true,
        categories: { select: { id: true, description: true } },
      },
    });

    const byCategoryMap = new Map<
      string,
      { categoryId: string; description: string; total: number }
    >();
    let otherTotal = 0;
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    for (const transaction of transactions) {
      const value = Number(transaction.value);
      if (!minDate || transaction.date < minDate) minDate = transaction.date;
      if (!maxDate || transaction.date > maxDate) maxDate = transaction.date;

      const matching = transaction.categories.filter((category) => selectedIds.has(category.id));

      if (matching.length === 0) {
        // No selected tag (including no tags at all): count the transaction
        // once, however many other tags it carries.
        otherTotal += value;
        continue;
      }

      for (const category of matching) {
        const existing = byCategoryMap.get(category.id);
        if (existing) {
          existing.total += value;
        } else {
          byCategoryMap.set(category.id, {
            categoryId: category.id,
            description: category.description,
            total: value,
          });
        }
      }
    }

    // An open-ended period averages over the span the data actually covers,
    // so "all time" doesn't divide by an arbitrary window.
    const rangeStart = from ?? minDate;
    const rangeEnd = to ?? maxDate;
    let divisor = 1;
    if (average !== "NONE" && rangeStart && rangeEnd) {
      const months = monthsBetween(rangeStart, rangeEnd);
      divisor = average === "MONTH" ? months : Math.max(1, months / 12);
    }

    return c.json({
      byCategory: Array.from(byCategoryMap.values()).map((entry) => ({
        ...entry,
        total: entry.total / divisor,
      })),
      otherTotal: otherTotal / divisor,
      divisor,
      rangeStart: rangeStart ?? null,
      rangeEnd: rangeEnd ?? null,
    });
  })
  .get("/series", zValidator("query", StatsSeriesFilters$), async (c) => {
    const user = c.get("user")!;
    const { from, to, buckets, categoryIds, metric, granularity } = c.req.valid("query");
    const selectedBuckets: TransactionBucket[] = buckets?.length ? buckets : ["MAIN"];
    const categoryFilter: Prisma.TransactionWhereInput = categoryIds?.length
      ? { categories: { some: { id: { in: categoryIds } } } }
      : {};

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        bucket: { in: selectedBuckets },
        ...categoryFilter,
        ...dateFilter(from, to),
      },
      select: { value: true, date: true, isPositive: true, bucket: true },
      orderBy: { date: "asc" },
    });

    const series = selectedBuckets.map((bucket) => ({ key: bucket, label: BUCKET_LABELS[bucket] }));
    const lastDate = transactions.at(-1)?.date;
    const rangeStart = from ?? transactions[0]?.date;
    // Without an end bound the series runs to the current period rather than
    // to the last transaction, so a bucket nothing has touched lately stays
    // flat up to today instead of looking like it stopped existing. A
    // post-dated transaction still wins, so nothing is ever cut off.
    const now = new Date();
    const rangeEnd = to ?? (lastDate && lastDate > now ? lastDate : now);

    if (!rangeStart || rangeStart > rangeEnd) {
      return c.json({ series, opening: {}, points: [] });
    }

    const periodKeys = enumeratePeriods(rangeStart, rangeEnd, granularity);
    const keyIndex = new Map(periodKeys.map((key, index) => [key, index]));
    // enumeratePeriods caps how far back a daily walk goes, so the window can
    // start later than asked for. The balance baseline has to follow it, or
    // the dropped periods would go missing from the running total.
    const windowStart = periodStart(periodKeys[0]!, granularity);

    // Where each bucket stood before the window opens. A running balance needs
    // it as its baseline, and it is returned either way so a caller charting
    // net movement can place the balance on either side of a period.
    const openingBalance = new Map<TransactionBucket, number>(
      selectedBuckets.map((bucket) => [bucket, 0]),
    );
    const previous = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        bucket: { in: selectedBuckets },
        ...categoryFilter,
        date: { lt: windowStart },
      },
      select: { value: true, isPositive: true, bucket: true },
    });
    for (const transaction of previous) {
      const signed = (transaction.isPositive ? 1 : -1) * Number(transaction.value);
      openingBalance.set(
        transaction.bucket,
        (openingBalance.get(transaction.bucket) ?? 0) + signed,
      );
    }
    const grid = periodKeys.map(
      () => new Map<TransactionBucket, { income: number; expense: number }>(),
    );

    for (const transaction of transactions) {
      const index = keyIndex.get(periodKey(transaction.date, granularity));
      if (index === undefined) continue;

      const cell = grid[index]!;
      const entry = cell.get(transaction.bucket) ?? { income: 0, expense: 0 };
      const value = Number(transaction.value);
      if (transaction.isPositive) entry.income += value;
      else entry.expense += value;
      cell.set(transaction.bucket, entry);
    }

    const running = new Map(openingBalance);
    const points = periodKeys.map((period, index) => {
      const row: Record<string, string | number> = { period };
      for (const bucket of selectedBuckets) {
        const entry = grid[index]!.get(bucket) ?? { income: 0, expense: 0 };
        const net = entry.income - entry.expense;
        running.set(bucket, (running.get(bucket) ?? 0) + net);

        row[bucket] =
          metric === "INCOME"
            ? entry.income
            : metric === "EXPENSE"
              ? entry.expense
              : metric === "BALANCE"
                ? running.get(bucket)!
                : net;
      }
      return row;
    });

    return c.json({ series, opening: Object.fromEntries(openingBalance), points });
  });
