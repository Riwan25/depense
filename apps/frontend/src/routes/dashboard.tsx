import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ExpenseCategoryPieChart } from "@/features/dashboard/components/expense-category-pie-chart";
import { useTransactionYearlySummary } from "@/features/transactions/use-transactions";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

const trendConfig = {
  mainIncome: { label: "Income (main)", color: "#10b981" },
  chequeRepasIncome: { label: "Income (cheque repas)", color: "#6ee7b7" },
  mainExpense: { label: "Expense (main)", color: "#ef4444" },
  chequeRepasExpense: { label: "Expense (cheque repas)", color: "#fca5a5" },
} satisfies ChartConfig;

const currencyFormatter = new Intl.NumberFormat("fr-BE", {
  style: "currency",
  currency: "EUR",
});

const compactCurrencyFormatter = new Intl.NumberFormat("fr-BE", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

function DashboardPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: yearly } = useTransactionYearlySummary(year);

  const months = yearly?.months ?? [];
  const totals = yearly?.totals ?? {
    mainIncome: 0,
    mainExpense: 0,
    chequeRepasIncome: 0,
    chequeRepasExpense: 0,
  };
  const totalIncome = totals.mainIncome + totals.chequeRepasIncome;
  const totalExpense = totals.mainExpense + totals.chequeRepasExpense;

  return (
    <div className="pb-safe mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold sm:text-2xl">Stats</h1>
          <p className="text-muted-foreground text-sm">Income and expenses over the year.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous year"
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="w-14 text-center text-lg font-semibold tabular-nums">{year}</span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next year"
            onClick={() => setYear((y) => y + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <Card size="sm">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-4" />
            </span>
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Income ({year})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums sm:text-2xl">
              {currencyFormatter.format(totalIncome)}
            </p>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              Main: {currencyFormatter.format(totals.mainIncome)} · Cheque repas:{" "}
              {currencyFormatter.format(totals.chequeRepasIncome)}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <span className="flex size-7 items-center justify-center rounded-lg bg-red-500/15 text-red-600 dark:text-red-400">
              <TrendingDown className="size-4" />
            </span>
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Expense ({year})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums sm:text-2xl">
              {currencyFormatter.format(totalExpense)}
            </p>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              Main: {currencyFormatter.format(totals.mainExpense)} · Cheque repas:{" "}
              {currencyFormatter.format(totals.chequeRepasExpense)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income vs expense ({year})</CardTitle>
        </CardHeader>
        <CardContent>
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
                width={52}
                tickFormatter={(value: number) => compactCurrencyFormatter.format(value)}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="mainIncome"
                stackId="income"
                fill="var(--color-mainIncome)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="chequeRepasIncome"
                stackId="income"
                fill="var(--color-chequeRepasIncome)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="mainExpense"
                stackId="expense"
                fill="var(--color-mainExpense)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="chequeRepasExpense"
                stackId="expense"
                fill="var(--color-chequeRepasExpense)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <ExpenseCategoryPieChart />
    </div>
  );
}
