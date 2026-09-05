import * as z from "zod";

import { BetterAuthId$, Boolean$, Date$ } from "./base";

export const Category$ = z.object({
  id: z.string(),
  userId: BetterAuthId$,
  description: z.string().trim().min(1),
  isPositive: Boolean$,
  createdAt: Date$,
  updatedAt: Date$,
});
export type Category = z.infer<typeof Category$>;

export const CreateCategory$ = Category$.pick({
  description: true,
  isPositive: true,
});
export type CreateCategory = z.infer<typeof CreateCategory$>;

export const UpdateCategory$ = CreateCategory$.partial();
export type UpdateCategory = z.infer<typeof UpdateCategory$>;
