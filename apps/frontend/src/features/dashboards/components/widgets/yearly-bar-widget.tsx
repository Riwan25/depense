import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@repo/ui";
import type { YearlyBarWidgetConfig } from "@repo/utils";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { useDashboardYear } from "@/features/dashboards/dashboard-year";
import { compactCurrencyFormatter, currencyFormatter } from "@/features/dashboards/widget-catalog";
import { useTransactionYearlySummary } from "@/features/transactions/use-transactions";

import { YearStepper } from "./year-stepper";

const trendConfig = {
  mainIncome: { label: "Income (main)", color: "#10b981" },
  chequeRepasIncome: { label: "Income (cheque repas)", color: "#6ee7b7" },
  mainExpense: { label: "Expense (main)", color: "#ef4444" },
  chequeRepasExpense: { label: "Expense (cheque repas)", color: "#fca5a5" },
  savings: { label: "Savings (net)", color: "#2563eb" },
} satisfies ChartConfig;

export function YearlyBarWidget({ config }: { config: YearlyBarWidgetConfig }) {
  const { year, setYear } = useDashboardYear();
  const { data: yearly, isPending } = useTransactionYearlySummary(year);

  if (isPending) {
    return <p className="text-muted-foreground py-8 text-center text-sm">Loading…</p>;
  }

  const months = yearly?.months ?? [];
  const totals = yearly?.totals;

  return (
    <>
      <div className="mb-3 flex justify-end">
        <YearStepper year={year} onChange={setYear} />
      </div>
      <ChartContainer config={trendConfig} className="h-64 w-full sm:h-72">
        <BarChart data={months} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => compactCurrencyFormatter.format(value)}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="mainIncome" stackId="income" fill="var(--color-mainIncome)" />
          <Bar
            dataKey="chequeRepasIncome"
            stackId="income"
            fill="var(--color-chequeRepasIncome)"
            radius={[4, 4, 0, 0]}
          />
          <Bar dataKey="mainExpense" stackId="expense" fill="var(--color-mainExpense)" />
          <Bar
            dataKey="chequeRepasExpense"
            stackId="expense"
            fill="var(--color-chequeRepasExpense)"
            radius={[4, 4, 0, 0]}
          />
          {config.showSavings && (
            <Bar dataKey="savings" fill="var(--color-savings)" radius={[4, 4, 0, 0]} />
          )}
        </BarChart>
      </ChartContainer>
      {totals && (
        <p className="text-muted-foreground mt-2 text-center text-sm">
          {year} · in {currencyFormatter.format(totals.mainIncome + totals.chequeRepasIncome)} · out{" "}
          {currencyFormatter.format(totals.mainExpense + totals.chequeRepasExpense)}
          {config.showSavings && ` · saved ${currencyFormatter.format(totals.savings)}`}
        </p>
      )}
    </>
  );
}
