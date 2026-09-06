import {
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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ExpenseCategoryPieChart } from "@/features/dashboard/components/expense-category-pie-chart";
import {
  useTransactionMonthlySummary,
  useTransactionSummary,
} from "@/features/transactions/use-transactions";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

const trendConfig = {
  income: { label: "Income", color: "var(--chart-1)" },
  expense: { label: "Expense", color: "var(--chart-2)" },
} satisfies ChartConfig;

const categoryConfig = {
  total: { label: "Total", color: "var(--chart-3)" },
} satisfies ChartConfig;

function DashboardPage() {
  const { data: summary } = useTransactionSummary();
  const { data: monthly = [] } = useTransactionMonthlySummary();

  const categoryData = (summary?.byCategory ?? [])
    .map((c) => ({ description: c.description, total: Math.abs(c.total) }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link to="/" className="text-muted-foreground text-sm underline-offset-4 hover:underline">
          &larr; Back to transactions
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income vs expense (last 12 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={trendConfig} className="h-72 w-full">
            <BarChart data={monthly}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="income" fill="var(--color-income)" radius={4} />
              <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spend by category</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No transactions yet.
            </p>
          ) : (
            <ChartContainer config={categoryConfig} className="h-72 w-full">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="description"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={120}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <ExpenseCategoryPieChart />
    </div>
  );
}
