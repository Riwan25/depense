import * as z from "zod";

import { BetterAuthId$, Boolean$, Date$ } from "./base";
import { CategoryRef$ } from "./category";

export const Transaction$ = z.object({
  id: z.string().trim(),
  userId: BetterAuthId$,
  description: z.string().trim().min(1),
  comment: z.string().trim().nullish(),
  date: Date$,
  value: z.coerce.number().positive(),
  isPositive: Boolean$.default(false),
  isChequeRepas: Boolean$.default(false),
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
  isChequeRepas: true,
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
  income: z.number(),
  expense: z.number(),
});
export type MonthlySummary = z.infer<typeof MonthlySummary$>;

export const ExpenseByCategoryFilters$ = z.object({
  from: Date$.optional(),
  to: Date$.optional(),
  // Comma-separated category ids. A transaction counts toward every one of
  // these it's tagged with (intentional overlap), but toward `otherTotal` at
  // most once, however many non-selected categories it also carries.
  categoryIds: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.split(",").filter(Boolean) : undefined)),
});
export type ExpenseByCategoryFilters = z.infer<typeof ExpenseByCategoryFilters$>;
export type ExpenseByCategoryFiltersInput = z.input<typeof ExpenseByCategoryFilters$>;

export const ExpenseByCategoryEntry$ = z.object({
  categoryId: z.string().trim(),
  description: z.string().trim(),
  total: z.number(),
});
export type ExpenseByCategoryEntry = z.infer<typeof ExpenseByCategoryEntry$>;

export const ExpenseByCategorySummary$ = z.object({
  byCategory: z.array(ExpenseByCategoryEntry$),
  otherTotal: z.number(),
});
export type ExpenseByCategorySummary = z.infer<typeof ExpenseByCategorySummary$>;
