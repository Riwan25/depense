import * as z from "zod";

import { BetterAuthId$, Boolean$, Date$ } from "./base";

export const CategoryRef$ = z.object({
  id: z.string(),
  description: z.string(),
});
export type CategoryRef = z.infer<typeof CategoryRef$>;

export const CategoryGroupMemberRef$ = CategoryRef$.extend({
  isPositive: Boolean$,
});
export type CategoryGroupMemberRef = z.infer<typeof CategoryGroupMemberRef$>;

export const CategoryGroupRef$ = z.object({
  id: z.string(),
  name: z.string(),
  categories: z.array(CategoryGroupMemberRef$).default([]),
});
export type CategoryGroupRef = z.infer<typeof CategoryGroupRef$>;

export const Category$ = z.object({
  id: z.string(),
  userId: BetterAuthId$,
  description: z.string().trim().min(1),
  isPositive: Boolean$,
  isDefault: Boolean$.default(false),
  createdAt: Date$,
  updatedAt: Date$,
  // The group auto-created for this category when it was given sub-categories,
  // null when it has none.
  group: CategoryGroupRef$.nullish(),
});
export type Category = z.infer<typeof Category$>;

export const CreateCategory$ = Category$.pick({
  description: true,
  isPositive: true,
  isDefault: true,
}).extend({
  subCategoryIds: z.array(z.string()).optional(),
});
export type CreateCategory = z.infer<typeof CreateCategory$>;

export const UpdateCategory$ = CreateCategory$.partial();
export type UpdateCategory = z.infer<typeof UpdateCategory$>;

export const CategoryGroup$ = z.object({
  id: z.string(),
  userId: BetterAuthId$,
  name: z.string(),
  mainCategoryId: z.string(),
  categories: z.array(CategoryGroupMemberRef$).default([]),
  createdAt: Date$,
  updatedAt: Date$,
});
export type CategoryGroup = z.infer<typeof CategoryGroup$>;
