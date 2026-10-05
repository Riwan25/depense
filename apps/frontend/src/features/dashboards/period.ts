import type { StatPeriod, StatPeriodPreset } from "@repo/utils";

export const PERIOD_PRESET_LABELS: Record<StatPeriodPreset, string> = {
  THIS_MONTH: "This month",
  LAST_MONTH: "Last month",
  LAST_3_MONTHS: "Last 3 months",
  LAST_6_MONTHS: "Last 6 months",
  LAST_12_MONTHS: "Last 12 months",
  THIS_YEAR: "This year",
  LAST_YEAR: "Last year",
  ALL_TIME: "All time",
  CUSTOM: "Custom range",
};

export const PERIOD_PRESETS = Object.keys(PERIOD_PRESET_LABELS) as StatPeriodPreset[];

export interface ResolvedPeriod {
  from?: Date;
  to?: Date;
  label: string;
}

// Transaction dates are stored as UTC midnight of the day the user picked
// (a "YYYY-MM-DD" string parses as UTC), so period bounds are built in UTC
// too. Building them locally would shift the edges by the browser's offset
// and drop or pull in a day at each end.
function startOfMonthUtc(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
}

function endOfMonthUtc(year: number, month: number) {
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
}

/**
 * Turns a saved period into concrete dates. Presets are resolved against the
 * caller's clock rather than being frozen at save time, so "this month" keeps
 * meaning this month. `from`/`to` come back undefined for ALL_TIME, which the
 * API reads as "no bound".
 */
export function resolvePeriod(period: StatPeriod, now = new Date()): ResolvedPeriod {
  // Which month it is is a local question; where that month starts and ends
  // is a UTC one.
  const year = now.getFullYear();
  const month = now.getMonth();
  const label = PERIOD_PRESET_LABELS[period.preset];

  switch (period.preset) {
    case "THIS_MONTH":
      return { from: startOfMonthUtc(year, month), to: endOfMonthUtc(year, month), label };
    case "LAST_MONTH":
      return { from: startOfMonthUtc(year, month - 1), to: endOfMonthUtc(year, month - 1), label };
    case "LAST_3_MONTHS":
      return { from: startOfMonthUtc(year, month - 2), to: endOfMonthUtc(year, month), label };
    case "LAST_6_MONTHS":
      return { from: startOfMonthUtc(year, month - 5), to: endOfMonthUtc(year, month), label };
    case "LAST_12_MONTHS":
      return { from: startOfMonthUtc(year, month - 11), to: endOfMonthUtc(year, month), label };
    case "THIS_YEAR":
      return { from: startOfMonthUtc(year, 0), to: endOfMonthUtc(year, 11), label };
    case "LAST_YEAR":
      return { from: startOfMonthUtc(year - 1, 0), to: endOfMonthUtc(year - 1, 11), label };
    case "ALL_TIME":
      return { label };
    case "CUSTOM": {
      const from = period.from ? new Date(`${period.from}T00:00:00.000Z`) : undefined;
      const to = period.to ? new Date(`${period.to}T23:59:59.999Z`) : undefined;
      return {
        from,
        to,
        label: period.from || period.to ? `${period.from ?? "…"} → ${period.to ?? "…"}` : label,
      };
    }
  }
}
