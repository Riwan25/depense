import type { YearTotalsWidgetConfig } from "@repo/utils";
import { PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

import { useDashboardYear } from "@/features/dashboards/dashboard-year";
import { currencyFormatter } from "@/features/dashboards/widget-catalog";
import { useTransactionYearlySummary } from "@/features/transactions/use-transactions";

import { YearStepper } from "./year-stepper";

function Tile({
  icon,
  tone,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  tone: string;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="bg-background/40 ring-foreground/10 rounded-xl p-3 ring-1">
      <div className="flex items-center gap-2">
        <span className={`flex size-7 items-center justify-center rounded-lg ${tone}`}>{icon}</span>
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
      </div>
      <p className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">
        {currencyFormatter.format(value)}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">{detail}</p>
    </div>
  );
}

// The saved year only decides where the dashboard opens; from then on every
// year-based widget on the page reads the same one, so stepping any of them
// moves them all.
export function YearTotalsWidget(_props: { config: YearTotalsWidgetConfig }) {
  const { year, setYear } = useDashboardYear();
  const { data: yearly, isPending } = useTransactionYearlySummary(year);

  if (isPending) {
    return <p className="text-muted-foreground py-6 text-center text-sm">Loading…</p>;
  }

  const totals = yearly?.totals ?? {
    mainIncome: 0,
    mainExpense: 0,
    chequeRepasIncome: 0,
    chequeRepasExpense: 0,
    savings: 0,
  };

  return (
    <>
      <div className="mb-3 flex justify-end">
        <YearStepper year={year} onChange={setYear} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Tile
          icon={<TrendingUp className="size-4" />}
          tone="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          label={`Income (${year})`}
          value={totals.mainIncome + totals.chequeRepasIncome}
          detail={`Main: ${currencyFormatter.format(totals.mainIncome)} · Cheque repas: ${currencyFormatter.format(totals.chequeRepasIncome)}`}
        />
        <Tile
          icon={<TrendingDown className="size-4" />}
          tone="bg-red-500/15 text-red-600 dark:text-red-400"
          label={`Expense (${year})`}
          value={totals.mainExpense + totals.chequeRepasExpense}
          detail={`Main: ${currencyFormatter.format(totals.mainExpense)} · Cheque repas: ${currencyFormatter.format(totals.chequeRepasExpense)}`}
        />
        <Tile
          icon={<PiggyBank className="size-4" />}
          tone="bg-blue-500/15 text-blue-600 dark:text-blue-400"
          label={`Savings (${year})`}
          value={totals.savings}
          detail="Net of everything moved in and out of savings"
        />
      </div>
    </>
  );
}
