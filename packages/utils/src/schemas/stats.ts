import * as z from "zod";

import { Date$ } from "./base";
import { TransactionBucket$ } from "./transaction";

/**
 * Named windows a widget can be pinned to. Everything but CUSTOM is resolved
 * against "now" on the client, so a dashboard saved today keeps meaning
 * "this month" tomorrow.
 */
export const StatPeriodPreset$ = z.enum([
  "THIS_MONTH",
  "LAST_MONTH",
  "LAST_3_MONTHS",
  "LAST_6_MONTHS",
  "LAST_12_MONTHS",
  "THIS_YEAR",
  "LAST_YEAR",
  "ALL_TIME",
  "CUSTOM",
]);
export type StatPeriodPreset = z.infer<typeof StatPeriodPreset$>;

export const StatPeriod$ = z.object({
  preset: StatPeriodPreset$.default("THIS_MONTH"),
  // "YYYY-MM-DD", only meaningful when preset is CUSTOM.
  from: z.string().trim().nullish(),
  to: z.string().trim().nullish(),
});
export type StatPeriod = z.infer<typeof StatPeriod$>;
export type StatPeriodInput = z.input<typeof StatPeriod$>;

export const StatFlow$ = z.enum(["EXPENSE", "INCOME"]);
export type StatFlow = z.infer<typeof StatFlow$>;

/** Divide the period total by its months / years instead of showing the sum. */
export const StatAverage$ = z.enum(["NONE", "MONTH", "YEAR"]);
export type StatAverage = z.infer<typeof StatAverage$>;

export const StatMetric$ = z.enum(["NET", "INCOME", "EXPENSE", "BALANCE"]);
export type StatMetric = z.infer<typeof StatMetric$>;

export const StatGranularity$ = z.enum(["DAY", "MONTH", "YEAR"]);
export type StatGranularity = z.infer<typeof StatGranularity$>;

const CsvList$ = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value.split(",").filter(Boolean) : undefined));

export const StatsByCategoryFilters$ = z.object({
  from: Date$.optional(),
  to: Date$.optional(),
  // Comma-separated category ids. A transaction counts toward every selected
  // category it carries, but toward `otherTotal` at most once.
  categoryIds: CsvList$,
  buckets: CsvList$.pipe(z.array(TransactionBucket$).optional()),
  flow: StatFlow$.default("EXPENSE"),
  average: StatAverage$.default("NONE"),
});
export type StatsByCategoryFilters = z.infer<typeof StatsByCategoryFilters$>;

export const StatsByCategorySummary$ = z.object({
  byCategory: z.array(
    z.object({
      categoryId: z.string().trim(),
      description: z.string().trim(),
      total: z.number(),
    }),
  ),
  otherTotal: z.number(),
  // Number of periods the raw totals were divided by (1 when average is NONE).
  divisor: z.number(),
  // Window the figures actually cover, null when there was nothing to cover.
  rangeStart: Date$.nullable(),
  rangeEnd: Date$.nullable(),
});
export type StatsByCategorySummary = z.infer<typeof StatsByCategorySummary$>;

export const StatsSeriesFilters$ = z.object({
  from: Date$.optional(),
  to: Date$.optional(),
  buckets: CsvList$.pipe(z.array(TransactionBucket$).optional()),
  categoryIds: CsvList$,
  metric: StatMetric$.default("NET"),
  granularity: StatGranularity$.default("DAY"),
});
export type StatsSeriesFilters = z.infer<typeof StatsSeriesFilters$>;

export const StatsSeriesSummary$ = z.object({
  series: z.array(z.object({ key: TransactionBucket$, label: z.string().trim() })),
  // Where each bucket stood just before the first point. Lets a caller
  // reconstruct the balance on either side of a period from the net figures
  // without asking for the series twice.
  // Partial: only the buckets that were asked for are present.
  opening: z.partialRecord(TransactionBucket$, z.number()).default({}),
  // One row per period, with a numeric column per bucket key, e.g.
  // { period: "2026-01", MAIN: -120.5, SAVINGS: 200 }.
  points: z.array(z.record(z.string(), z.union([z.string().trim(), z.number()]))),
});
export type StatsSeriesSummary = z.infer<typeof StatsSeriesSummary$>;
