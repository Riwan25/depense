import type { Prisma } from "@generated/prisma/client";
import { zValidator } from "@hono/zod-validator";
import {
  CreateSavingsTransfer$,
  CreateTransaction$,
  ExpenseByCategoryFilters$,
  TransactionFilters$,
  UpdateTransaction$,
  YearlySummaryFilters$,
  type MonthlySummary,
} from "@repo/utils";
import { Hono } from "hono";

import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/middlewares/use-auth";

const transactionInclude = {
  categories: { select: { id: true, description: true, isPositive: true } },
} as const;

async function validateCategoryIds(userId: string, categoryIds: string[]) {
  if (categoryIds.length === 0) {
    return { ok: true as const, categories: [] };
  }

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds }, userId },
    select: { id: true, isPositive: true },
  });

  if (categories.length !== new Set(categoryIds).size) {
    return { ok: false as const, error: "One or more categories not found" };
  }
  if (new Set(categories.map((category) => category.isPositive)).size > 1) {
    return {
      ok: false as const,
      error: "A transaction's categories must be all income or all expense",
    };
  }

  return { ok: true as const, categories };
}

export const transactionsRoutes = new Hono()
  .use(isAuthenticated)
  .get("/", zValidator("query", TransactionFilters$), async (c) => {
    const user = c.get("user")!;
    const { from, to, categoryId, bucket, page, pageSize } = c.req.valid("query");

    const where: Prisma.TransactionWhereInput = {
      userId: user.id,
      ...(categoryId ? { categories: { some: { id: categoryId } } } : {}),
      ...(bucket !== undefined ? { bucket } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: transactionInclude,
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.transaction.count({ where }),
    ]);

    return c.json({ transactions, total, page, pageSize });
  })
  .get("/summary", async (c) => {
    const user = c.get("user")!;

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: transactionInclude,
    });

    let mainBalance = 0;
    let chequeRepasBalance = 0;
    let savingsBalance = 0;
    const byCategoryMap = new Map<
      string,
      { categoryId: string | null; description: string; isPositive: boolean; total: number }
    >();

    for (const transaction of transactions) {
      const value = Number(transaction.value);
      const isPositive = transaction.isPositive;
      const signedValue = isPositive ? value : -value;

      if (transaction.bucket === "CHEQUE_REPAS") {
        chequeRepasBalance += signedValue;
      } else if (transaction.bucket === "SAVINGS") {
        savingsBalance += signedValue;
      } else {
        mainBalance += signedValue;
      }

      // Transfer legs carry no categories and are a net-zero wash across the
      // pair; excluding them keeps them out of the "Uncategorized" bucket.
      if (transaction.transferGroupId) continue;

      const categories =
        transaction.categories.length > 0
          ? transaction.categories
          : [{ id: "uncategorized", description: "Uncategorized", isPositive }];

      for (const category of categories) {
        const key = category.id;
        const existing = byCategoryMap.get(key);
        if (existing) {
          existing.total += signedValue;
        } else {
          byCategoryMap.set(key, {
            categoryId: category.id === "uncategorized" ? null : category.id,
            description: category.description,
            isPositive,
            total: signedValue,
          });
        }
      }
    }

    return c.json({
      mainBalance,
      chequeRepasBalance,
      savingsBalance,
      byCategory: Array.from(byCategoryMap.values()),
    });
  })
  .get("/summary/monthly", zValidator("query", YearlySummaryFilters$), async (c) => {
    const user = c.get("user")!;
    const year = c.req.valid("query").year ?? new Date().getFullYear();

    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: start, lt: end }, bucket: { not: "SAVINGS" } },
    });

    const months: MonthlySummary[] = Array.from({ length: 12 }, (_, i) => ({
      month: `${year}-${String(i + 1).padStart(2, "0")}`,
      mainIncome: 0,
      mainExpense: 0,
      chequeRepasIncome: 0,
      chequeRepasExpense: 0,
    }));
    const totals = { mainIncome: 0, mainExpense: 0, chequeRepasIncome: 0, chequeRepasExpense: 0 };

    for (const transaction of transactions) {
      const date = new Date(transaction.date);
      const entry = months[date.getMonth()]!;
      const value = Number(transaction.value);
      const isChequeRepas = transaction.bucket === "CHEQUE_REPAS";

      if (transaction.isPositive) {
        if (isChequeRepas) {
          entry.chequeRepasIncome += value;
          totals.chequeRepasIncome += value;
        } else {
          entry.mainIncome += value;
          totals.mainIncome += value;
        }
      } else {
        if (isChequeRepas) {
          entry.chequeRepasExpense += value;
          totals.chequeRepasExpense += value;
        } else {
          entry.mainExpense += value;
          totals.mainExpense += value;
        }
      }
    }

    return c.json({ year, months, totals });
  })
  .get("/summary/by-category", zValidator("query", ExpenseByCategoryFilters$), async (c) => {
    const user = c.get("user")!;
    const { from, to, categoryIds } = c.req.valid("query");
    const selectedIds = new Set(categoryIds ?? []);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        isPositive: false,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      include: transactionInclude,
    });

    const byCategoryMap = new Map<
      string,
      { categoryId: string; description: string; total: number }
    >();
    let otherTotal = 0;

    for (const transaction of transactions) {
      const value = Number(transaction.value);
      const matching = transaction.categories.filter((category) => selectedIds.has(category.id));

      if (matching.length === 0) {
        // No tagged category is selected (including no categories at all):
        // count the transaction once, however many other tags it carries.
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

    return c.json({ byCategory: Array.from(byCategoryMap.values()), otherTotal });
  })
  .post("/", zValidator("json", CreateTransaction$), async (c) => {
    const user = c.get("user")!;
    const { categoryIds, ...data } = c.req.valid("json");

    const validation = await validateCategoryIds(user.id, categoryIds);
    if (!validation.ok) {
      return c.json({ error: validation.error }, 400);
    }

    // Once categories are picked, the transaction's sign is locked to theirs
    // rather than whatever was passed in.
    const isPositive =
      categoryIds.length > 0 ? validation.categories[0]!.isPositive : data.isPositive;

    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        isPositive,
        userId: user.id,
        categories: { connect: categoryIds.map((id) => ({ id })) },
      },
      include: transactionInclude,
    });

    return c.json(transaction, 201);
  })
  .patch("/:id", zValidator("json", UpdateTransaction$), async (c) => {
    const user = c.get("user")!;
    const { id } = c.req.param();
    const { categoryIds, ...data } = c.req.valid("json");

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
      include: transactionInclude,
    });
    if (!existing) {
      return c.json({ error: "Transaction not found" }, 404);
    }
    if (existing.transferGroupId) {
      return c.json(
        {
          error:
            "Transfer transactions cannot be edited. Delete and recreate the transfer instead.",
        },
        400,
      );
    }

    let isPositive = data.isPositive;

    if (categoryIds !== undefined) {
      const validation = await validateCategoryIds(user.id, categoryIds);
      if (!validation.ok) {
        return c.json({ error: validation.error }, 400);
      }
      isPositive = categoryIds.length > 0 ? validation.categories[0]!.isPositive : data.isPositive;
    } else if (existing.categories.length > 0) {
      // Categories aren't being touched and already lock the sign: ignore
      // any isPositive passed in.
      isPositive = existing.isPositive;
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        ...(isPositive !== undefined ? { isPositive } : {}),
        ...(categoryIds !== undefined
          ? { categories: { set: categoryIds.map((id) => ({ id })) } }
          : {}),
      },
      include: transactionInclude,
    });

    return c.json(transaction);
  })
  .delete("/:id", async (c) => {
    const user = c.get("user")!;
    const { id } = c.req.param();

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return c.json({ error: "Transaction not found" }, 404);
    }

    if (existing.transferGroupId) {
      await prisma.transaction.deleteMany({
        where: { transferGroupId: existing.transferGroupId, userId: user.id },
      });
    } else {
      await prisma.transaction.delete({ where: { id } });
    }

    return c.body(null, 204);
  })
  .post("/transfer/savings", zValidator("json", CreateSavingsTransfer$), async (c) => {
    const user = c.get("user")!;
    const { direction, value, date, comment, categoryIds } = c.req.valid("json");

    if (categoryIds.length > 0) {
      const count = await prisma.category.count({
        where: { id: { in: categoryIds }, userId: user.id },
      });
      if (count !== new Set(categoryIds).size) {
        return c.json({ error: "One or more categories not found" }, 400);
      }
    }

    const [fromBucket, toBucket] =
      direction === "MAIN_TO_SAVINGS"
        ? (["MAIN", "SAVINGS"] as const)
        : (["SAVINGS", "MAIN"] as const);
    const description =
      direction === "MAIN_TO_SAVINGS" ? "Transfer to savings" : "Transfer to main";
    const transferGroupId = crypto.randomUUID();
    // Both legs of a transfer represent the same real-world movement, so they
    // share the same categories even though their isPositive signs differ -
    // the sign here comes from the direction, not from the categories.
    const categories = { connect: categoryIds.map((id) => ({ id })) };

    const [fromTransaction, toTransaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: user.id,
          description,
          comment,
          date,
          value,
          isPositive: false,
          bucket: fromBucket,
          transferGroupId,
          categories,
        },
        include: transactionInclude,
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          description,
          comment,
          date,
          value,
          isPositive: true,
          bucket: toBucket,
          transferGroupId,
          categories,
        },
        include: transactionInclude,
      }),
    ]);

    return c.json({ transferGroupId, transactions: [fromTransaction, toTransaction] }, 201);
  });
