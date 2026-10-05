import type { DashboardWidget } from "@repo/utils";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface DashboardYearValue {
  year: number;
  setYear: (year: number) => void;
}

const DashboardYearContext = createContext<DashboardYearValue | null>(null);

/**
 * One year for the whole page: stepping it on any card moves every year-based
 * widget together, the way the Stats page moves as a unit. It is viewing state,
 * never written back - a dashboard left on the current year rolls over on its
 * own in January.
 *
 * Mount this with `key={dashboard.id}` so switching pages re-seeds the year
 * instead of carrying the previous page's.
 */
export function DashboardYearProvider({
  widgets,
  children,
}: {
  widgets: DashboardWidget[];
  children: ReactNode;
}) {
  // A widget saved with an explicit year decides where the page opens; the
  // first one wins, since there is only one year to open on.
  const [year, setYear] = useState(() => {
    for (const widget of widgets) {
      const configured = "year" in widget.config ? widget.config.year : null;
      if (configured != null) return configured;
    }
    return new Date().getFullYear();
  });

  const value = useMemo(() => ({ year, setYear }), [year]);

  return <DashboardYearContext value={value}>{children}</DashboardYearContext>;
}

/**
 * Falls back to its own state when there is no provider, so a widget rendered
 * outside a dashboard still has a working stepper rather than a dead one.
 */
export function useDashboardYear(): DashboardYearValue {
  const shared = useContext(DashboardYearContext);
  const [fallbackYear, setFallbackYear] = useState(() => new Date().getFullYear());
  return shared ?? { year: fallbackYear, setYear: setFallbackYear };
}
