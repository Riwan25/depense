import * as z from "zod";

import { BetterAuthId$, Boolean$, Date$ } from "./base";
import { CategoryRef$ } from "./category";

export const TransactionBucket$ = z.enum(["MAIN", "CHEQUE_REPAS", "SAVINGS"]);
export type TransactionBucket = z.infer<typeof TransactionBucket$>;

export const Transaction$ = z.object({
  id: z.string().trim(),
  userId: BetterAuthId$,
  description: z.string().trim().min(1),
  comment: z.string().trim().nullish(),
  date: Date$,
  value: z.coerce.number().positive(),
  isPositive: Boolean$.default(false),
  bucket: TransactionBucket$.default("MAIN"),
  transferGroupId: z.string().trim().nullish(),
  createdAt: Date$,
  updatedAt: Date$,
});
export type Transaction = z.infer<typeof Transaction$>;

export const TransactionCategoryRef$ = CategoryRef$.extend({
  isPositive: Boolean$,
});
export type TransactionCategoryRef = z.infer<typeof TransactionCategoryRef$>;

export const TransactionWithCategories$ = Transaction$.extend({
  categories: z.array(TransactionCategoryRef$).default([]),
});
export type TransactionWithCategories = z.infer<typeof TransactionWithCategories$>;

export const CreateTransaction$ = Transaction$.pick({
  description: true,
  comment: true,
  date: true,
  value: true,
  isPositive: true,
  bucket: true,
}).extend({
  // No .default(): under UpdateTransaction$'s .partial(), a defaulted array
  // would resolve to [] (not undefined) when the key is omitted, making it
  // indistinguishable from "explicitly clear the categories".
  categoryIds: z.array(z.string().trim()),
});
export type CreateTransaction = z.infer<typeof CreateTransaction$>;
export type CreateTransactionInput = z.input<typeof CreateTransaction$>;

export const UpdateTransaction$ = CreateTransaction$.partial();
export type UpdateTransaction = z.infer<typeof UpdateTransaction$>;
export type UpdateTransactionInput = z.input<typeof UpdateTransaction$>;

export const TransactionFilters$ = z.object({
  from: Date$.optional(),
  to: Date$.optional(),
  categoryId: z.string().trim().optional(),
  bucket: TransactionBucket$.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});
export type TransactionFilters = z.infer<typeof TransactionFilters$>;

export const TransactionSummary$ = z.object({
  mainBalance: z.number(),
  chequeRepasBalance: z.number(),
  savingsBalance: z.number(),
  byCategory: z.array(
    z.object({
      categoryId: z.string().trim().nullable(),
      description: z.string().trim(),
      isPositive: z.boolean(),
      total: z.number(),
    }),
  ),
});
export type TransactionSummary = z.infer<typeof TransactionSummary$>;

export const MonthlySummary$ = z.object({
  month: z.string().trim(),
  mainIncome: z.number(),
  mainExpense: z.number(),
  chequeRepasIncome: z.number(),
  chequeRepasExpense: z.number(),
  // Net movement of the savings bucket - money in minus money out - so a month
  // that drew savings down is negative. Not split by bucket: the savings
  // bucket has no cheque repas side.
  savings: z.number(),
});
export type MonthlySummary = z.infer<typeof MonthlySummary$>;

export const YearlySummaryTotals$ = z.object({
  mainIncome: z.number(),
  mainExpense: z.number(),
  chequeRepasIncome: z.number(),
  chequeRepasExpense: z.number(),
  savings: z.number(),
});
export type YearlySummaryTotals = z.infer<typeof YearlySummaryTotals$>;

export const YearlySummary$ = z.object({
  year: z.int(),
  months: z.array(MonthlySummary$).length(12),
  totals: YearlySummaryTotals$,
});
export type YearlySummary = z.infer<typeof YearlySummary$>;

export const YearlySummaryFilters$ = z.object({
  year: z.coerce.number().int().optional(),
});
export type YearlySummaryFilters = z.infer<typeof YearlySummaryFilters$>;
export type YearlySummaryFiltersInput = z.input<typeof YearlySummaryFilters$>;

export const SavingsTransferDirection$ = z.enum(["MAIN_TO_SAVINGS", "SAVINGS_TO_MAIN"]);
export type SavingsTransferDirection = z.infer<typeof SavingsTransferDirection$>;

export const CreateSavingsTransfer$ = z.object({
  direction: SavingsTransferDirection$,
  value: z.coerce.number().positive(),
  date: Date$,
  comment: z.string().trim().nullish(),
  categoryIds: z.array(z.string().trim()).default([]),
});
export type CreateSavingsTransfer = z.infer<typeof CreateSavingsTransfer$>;
export type CreateSavingsTransferInput = z.input<typeof CreateSavingsTransfer$>;

export const SavingsTransferResult$ = z.object({
  transferGroupId: z.string().trim(),
  transactions: z.array(TransactionWithCategories$).length(2),
});
export type SavingsTransferResult = z.infer<typeof SavingsTransferResult$>;
