import { CreateTransaction$, TransactionFilters$, UpdateTransaction$ } from "@repo/utils";
import { zValidator } from "@hono/zod-validator";
import type { Prisma } from "@generated/prisma/client";
import { Hono } from "hono";

import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/middlewares/use-auth";

export const transactionsRoutes = new Hono()
  .use(isAuthenticated)
  .get("/", zValidator("query", TransactionFilters$), async (c) => {
    const user = c.get("user")!;
    const { from, to, categoryId, isChequeRepas, page, pageSize } = c.req.valid("query");

    const where: Prisma.TransactionWhereInput = {
      userId: user.id,
      ...(categoryId ? { categoryId } : {}),
      ...(isChequeRepas !== undefined ? { isChequeRepas } : {}),
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
        include: { category: true },
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
      include: { category: true },
    });

    let mainBalance = 0;
    let chequeRepasBalance = 0;
    const byCategoryMap = new Map<
      string,
      { categoryId: string | null; description: string; isPositive: boolean; total: number }
    >();

    for (const transaction of transactions) {
      const value = Number(transaction.value);
      const isPositive = transaction.category?.isPositive ?? false;
      const signedValue = isPositive ? value : -value;

      if (transaction.isChequeRepas) {
        chequeRepasBalance += signedValue;
      } else {
        mainBalance += signedValue;
      }

      const key = transaction.categoryId ?? "uncategorized";
      const existing = byCategoryMap.get(key);
      if (existing) {
        existing.total += signedValue;
      } else {
        byCategoryMap.set(key, {
          categoryId: transaction.categoryId,
          description: transaction.category?.description ?? "Uncategorized",
          isPositive,
          total: signedValue,
        });
      }
    }

    return c.json({
      mainBalance,
      chequeRepasBalance,
      byCategory: Array.from(byCategoryMap.values()),
    });
  })
  .get("/summary/monthly", async (c) => {
    const user = c.get("user")!;

    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: since } },
      include: { category: true },
    });

    const monthsMap = new Map<string, { month: string; income: number; expense: number }>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(since);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthsMap.set(key, { month: key, income: 0, expense: 0 });
    }

    for (const transaction of transactions) {
      const date = new Date(transaction.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthsMap.get(key);
      if (!entry) continue;

      const value = Number(transaction.value);
      if (transaction.category?.isPositive) {
        entry.income += value;
      } else {
        entry.expense += value;
      }
    }

    return c.json(Array.from(monthsMap.values()));
  })
  .post("/", zValidator("json", CreateTransaction$), async (c) => {
    const user = c.get("user")!;
    const data = c.req.valid("json");

    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, userId: user.id },
      });
      if (!category) {
        return c.json({ error: "Category not found" }, 404);
      }
    }

    const transaction = await prisma.transaction.create({
      data: { ...data, userId: user.id },
      include: { category: true },
    });

    return c.json(transaction, 201);
  })
  .patch("/:id", zValidator("json", UpdateTransaction$), async (c) => {
    const user = c.get("user")!;
    const { id } = c.req.param();
    const data = c.req.valid("json");

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return c.json({ error: "Transaction not found" }, 404);
    }

    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, userId: user.id },
      });
      if (!category) {
        return c.json({ error: "Category not found" }, 404);
      }
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data,
      include: { category: true },
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

    await prisma.transaction.delete({ where: { id } });

    return c.body(null, 204);
  });
