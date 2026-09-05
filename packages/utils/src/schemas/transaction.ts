import * as z from "zod";

import { BetterAuthId$, Boolean$, Date$ } from "./base";
import { Category$ } from "./category";

export const Transaction$ = z.object({
  id: z.string(),
  userId: BetterAuthId$,
  categoryId: z.string().nullish(),
  description: z.string().trim().min(1),
  comment: z.string().trim().nullish(),
  date: Date$,
  value: z.coerce.number().positive(),
  isChequeRepas: Boolean$.default(false),
  createdAt: Date$,
  updatedAt: Date$,
});
export type Transaction = z.infer<typeof Transaction$>;

export const TransactionWithCategory$ = Transaction$.extend({
  category: Category$.nullish(),
});
export type TransactionWithCategory = z.infer<typeof TransactionWithCategory$>;

export const CreateTransaction$ = Transaction$.pick({
  categoryId: true,
  description: true,
  comment: true,
  date: true,
  value: true,
  isChequeRepas: true,
});
export type CreateTransaction = z.infer<typeof CreateTransaction$>;
export type CreateTransactionInput = z.input<typeof CreateTransaction$>;

export const UpdateTransaction$ = CreateTransaction$.partial();
export type UpdateTransaction = z.infer<typeof UpdateTransaction$>;
export type UpdateTransactionInput = z.input<typeof UpdateTransaction$>;

export const TransactionFilters$ = z.object({
  from: Date$.optional(),
  to: Date$.optional(),
  categoryId: z.string().optional(),
  isChequeRepas: Boolean$.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});
export type TransactionFilters = z.infer<typeof TransactionFilters$>;

export const TransactionSummary$ = z.object({
  mainBalance: z.number(),
  chequeRepasBalance: z.number(),
  byCategory: z.array(
    z.object({
      categoryId: z.string().nullable(),
      description: z.string(),
      isPositive: z.boolean(),
      total: z.number(),
    }),
  ),
});
export type TransactionSummary = z.infer<typeof TransactionSummary$>;

export const MonthlySummary$ = z.object({
  month: z.string(),
  income: z.number(),
  expense: z.number(),
});
export type MonthlySummary = z.infer<typeof MonthlySummary$>;
