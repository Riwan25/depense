import * as z from "zod";

import { Date$ } from "./base";
import { StatAverage$, StatFlow$, StatGranularity$, StatMetric$, StatPeriod$ } from "./stats";
import { TransactionBucket$ } from "./transaction";

export const DashboardWidgetType$ = z.enum([
  "CATEGORY_PIE",
  "BUCKET_TREND",
  "CATEGORY_STAT",
  "YEARLY_BAR",
  "BUCKET_MONTHLY_DIFF",
  "YEAR_TOTALS",
]);
export type DashboardWidgetType = z.infer<typeof DashboardWidgetType$>;

export const DashboardWidgetWidth$ = z.enum(["HALF", "FULL"]);
export type DashboardWidgetWidth = z.infer<typeof DashboardWidgetWidth$>;

/** Buckets a category breakdown looks at by default: the savings bucket is
 * left out so the mirror leg of a transfer isn't counted twice. */
export const DEFAULT_STAT_BUCKETS = ["MAIN", "CHEQUE_REPAS"] as const;

const CategoryBreakdownFields$ = z.object({
  period: StatPeriod$,
  categoryIds: z.array(z.string().trim()).default([]),
  buckets: z.array(TransactionBucket$).default([...DEFAULT_STAT_BUCKETS]),
  flow: StatFlow$.default("EXPENSE"),
  average: StatAverage$.default("NONE"),
});

export const CategoryPieWidgetConfig$ = CategoryBreakdownFields$.extend({
  type: z.literal("CATEGORY_PIE"),
  // Folds every non-selected (and uncategorized) transaction into one slice.
  includeOther: z.boolean().default(false),
});
export type CategoryPieWidgetConfig = z.infer<typeof CategoryPieWidgetConfig$>;

export const CategoryStatWidgetConfig$ = CategoryBreakdownFields$.extend({
  type: z.literal("CATEGORY_STAT"),
  average: StatAverage$.default("MONTH"),
});
export type CategoryStatWidgetConfig = z.infer<typeof CategoryStatWidgetConfig$>;

export const BucketTrendWidgetConfig$ = z.object({
  type: z.literal("BUCKET_TREND"),
  period: StatPeriod$,
  buckets: z.array(TransactionBucket$).min(1).default(["MAIN"]),
  // Empty means "every transaction in the bucket". Otherwise only those
  // carrying at least one of these categories count, whatever their sign -
  // a trend has no income/expense side to pick.
  categoryIds: z.array(z.string().trim()).default([]),
  metric: StatMetric$.default("NET"),
  granularity: StatGranularity$.default("DAY"),
});
export type BucketTrendWidgetConfig = z.infer<typeof BucketTrendWidgetConfig$>;

export const YearlyBarWidgetConfig$ = z.object({
  type: z.literal("YEARLY_BAR"),
  // null means "whatever year it is now", so the widget keeps up on its own.
  year: z.int().nullish(),
  showSavings: z.boolean().default(true),
});
export type YearlyBarWidgetConfig = z.infer<typeof YearlyBarWidgetConfig$>;

/**
 * Month-by-month net movement of a bucket across one year: each bar is the
 * difference the month made, so a month that drew the bucket down reads below
 * zero.
 */
export const BucketMonthlyDiffWidgetConfig$ = z.object({
  type: z.literal("BUCKET_MONTHLY_DIFF"),
  // null means "whatever year it is now", so the widget keeps up on its own.
  year: z.int().nullish(),
  buckets: z.array(TransactionBucket$).min(1).default(["MAIN"]),
  // Empty means the whole bucket; otherwise only transactions carrying one of
  // these count, whatever their sign.
  categoryIds: z.array(z.string().trim()).default([]),
});
export type BucketMonthlyDiffWidgetConfig = z.infer<typeof BucketMonthlyDiffWidgetConfig$>;

/** The income / expense / savings headline tiles, as on the Stats page. */
export const YearTotalsWidgetConfig$ = z.object({
  type: z.literal("YEAR_TOTALS"),
  // null means "follow the dashboard's year selector".
  year: z.int().nullish(),
});
export type YearTotalsWidgetConfig = z.infer<typeof YearTotalsWidgetConfig$>;

export const DashboardWidgetConfig$ = z.discriminatedUnion("type", [
  CategoryPieWidgetConfig$,
  CategoryStatWidgetConfig$,
  BucketTrendWidgetConfig$,
  YearlyBarWidgetConfig$,
  BucketMonthlyDiffWidgetConfig$,
  YearTotalsWidgetConfig$,
]);
export type DashboardWidgetConfig = z.infer<typeof DashboardWidgetConfig$>;
export type DashboardWidgetConfigInput = z.input<typeof DashboardWidgetConfig$>;

export const DashboardWidget$ = z.object({
  id: z.string().trim(),
  dashboardId: z.string().trim(),
  title: z.string().trim(),
  type: DashboardWidgetType$,
  width: DashboardWidgetWidth$.default("FULL"),
  position: z.int(),
  config: DashboardWidgetConfig$,
  createdAt: Date$,
  updatedAt: Date$,
});
export type DashboardWidget = z.infer<typeof DashboardWidget$>;

export const Dashboard$ = z.object({
  id: z.string().trim(),
  name: z.string().trim().min(1),
  position: z.int(),
  createdAt: Date$,
  updatedAt: Date$,
  widgets: z.array(DashboardWidget$).default([]),
});
export type Dashboard = z.infer<typeof Dashboard$>;

export const CreateDashboard$ = z.object({
  name: z.string().trim().min(1).max(60),
});
export type CreateDashboard = z.infer<typeof CreateDashboard$>;

export const UpdateDashboard$ = CreateDashboard$.partial();
export type UpdateDashboard = z.infer<typeof UpdateDashboard$>;

export const CreateDashboardWidget$ = z.object({
  title: z.string().trim().min(1).max(80),
  width: DashboardWidgetWidth$.default("FULL"),
  config: DashboardWidgetConfig$,
});
export type CreateDashboardWidget = z.infer<typeof CreateDashboardWidget$>;
export type CreateDashboardWidgetInput = z.input<typeof CreateDashboardWidget$>;

// `config` is replaced wholesale rather than merged: its shape depends on the
// discriminant, so a partial patch could leave it inconsistent.
export const UpdateDashboardWidget$ = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  width: DashboardWidgetWidth$.optional(),
  config: DashboardWidgetConfig$.optional(),
});
export type UpdateDashboardWidget = z.infer<typeof UpdateDashboardWidget$>;
export type UpdateDashboardWidgetInput = z.input<typeof UpdateDashboardWidget$>;

export const ReorderDashboardWidgets$ = z.object({
  orderedIds: z.array(z.string().trim()),
});
export type ReorderDashboardWidgets = z.infer<typeof ReorderDashboardWidgets$>;

export const ReorderDashboards$ = z.object({
  orderedIds: z.array(z.string().trim()),
});
export type ReorderDashboards = z.infer<typeof ReorderDashboards$>;
