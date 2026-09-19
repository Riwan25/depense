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
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ExpenseCategoryPieChart } from "@/features/dashboard/components/expense-category-pie-chart";
import { useTransactionYearlySummary } from "@/features/transactions/use-transactions";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

const trendConfig = {
  mainIncome: { label: "Income (main)", color: "#059669" },
  chequeRepasIncome: { label: "Income (cheque repas)", color: "#6ee7b7" },
  mainExpense: { label: "Expense (main)", color: "#dc2626" },
  chequeRepasExpense: { label: "Expense (cheque repas)", color: "#fca5a5" },
} satisfies ChartConfig;

const currencyFormatter = new Intl.NumberFormat("fr-BE", {
  style: "currency",
  currency: "EUR",
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
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link to="/" className="text-muted-foreground text-sm underline-offset-4 hover:underline">
          &larr; Back to transactions
        </Link>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setYear((y) => y - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="w-16 text-center text-lg font-semibold">{year}</span>
        <Button variant="outline" size="icon" onClick={() => setYear((y) => y + 1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Income ({year})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{currencyFormatter.format(totalIncome)}</p>
            <p className="text-muted-foreground text-sm">
              Main: {currencyFormatter.format(totals.mainIncome)} · Cheque repas:{" "}
              {currencyFormatter.format(totals.chequeRepasIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Expense ({year})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{currencyFormatter.format(totalExpense)}</p>
            <p className="text-muted-foreground text-sm">
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
          <ChartContainer config={trendConfig} className="h-72 w-full">
            <BarChart data={months}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
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
