import type { StatGranularity } from "@repo/utils";

// Transaction dates are stored as UTC midnight of the day that was picked, so
// every bucketing key here is derived in UTC.

export function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function yearKey(date: Date) {
  return String(date.getUTCFullYear());
}

export function periodKey(date: Date, granularity: StatGranularity) {
  if (granularity === "DAY") return dayKey(date);
  if (granularity === "YEAR") return yearKey(date);
  return monthKey(date);
}

/** Inverse of {@link periodKey}: the first instant the key covers. */
export function periodStart(key: string, granularity: StatGranularity) {
  if (granularity === "DAY") return new Date(`${key}T00:00:00.000Z`);
  if (granularity === "YEAR") return new Date(`${key}-01-01T00:00:00.000Z`);
  return new Date(`${key}-01T00:00:00.000Z`);
}

/** Calendar months spanned by [start, end], both ends included. */
export function monthsBetween(start: Date, end: Date) {
  const months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth()) +
    1;
  return Math.max(1, months);
}

// A daily series over a decade is already 3 650 points; past that the chart is
// unreadable anyway, so the walk is bounded rather than left open-ended.
export const MAX_PERIOD_POINTS = 4000;

const DAY_MS = 86_400_000;

/**
 * Every period key from start to end inclusive, so a gap in the data still
 * gets a point on the chart instead of being skipped over.
 */
export function enumeratePeriods(start: Date, end: Date, granularity: StatGranularity) {
  const keys: string[] = [];

  if (granularity === "YEAR") {
    for (let year = start.getUTCFullYear(); year <= end.getUTCFullYear(); year++) {
      keys.push(String(year));
    }
    return keys;
  }

  if (granularity === "DAY") {
    const first = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
    const last = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
    // Over the cap, keep the most recent window: the near past is what a trend
    // is read for, and the periods dropped off the front are folded into the
    // opening balance by the caller.
    const span = Math.floor((last - first) / DAY_MS) + 1;
    const cursor = new Date(
      span > MAX_PERIOD_POINTS ? last - (MAX_PERIOD_POINTS - 1) * DAY_MS : first,
    );
    while (cursor.getTime() <= last) {
      keys.push(dayKey(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return keys;
  }

  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const last = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1);
  while (cursor.getTime() <= last) {
    keys.push(monthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys;
}
