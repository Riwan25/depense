import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
  type ChartConfig,
} from "@repo/ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { Cell, Pie, PieChart } from "recharts";

import { useCategories } from "@/features/categories/use-categories";
import { useExpenseByCategory } from "@/features/transactions/use-transactions";

const CATEGORICAL_COLORS = [
  "var(--chart-cat-1)",
  "var(--chart-cat-2)",
  "var(--chart-cat-3)",
  "var(--chart-cat-4)",
  "var(--chart-cat-5)",
  "var(--chart-cat-6)",
  "var(--chart-cat-7)",
  "var(--chart-cat-8)",
];
const OTHER_COLOR = "var(--chart-cat-other)";

const currencyFormatter = new Intl.NumberFormat("fr-BE", {
  style: "currency",
  currency: "EUR",
});

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfCurrentMonth() {
  const date = new Date();
  date.setDate(1);
  return date;
}

const chartConfig = {} satisfies ChartConfig;

export function ExpenseCategoryPieChart() {
  const { data: categories = [] } = useCategories();
  const expenseCategories = useMemo(() => categories.filter((c) => !c.isPositive), [categories]);

  const [from, setFrom] = useState(toDateInputValue(startOfCurrentMonth()));
  const [to, setTo] = useState(toDateInputValue(new Date()));
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [showOther, setShowOther] = useState(false);
  const hasInitializedSelection = useRef(false);

  useEffect(() => {
    if (hasInitializedSelection.current || expenseCategories.length === 0) return;
    hasInitializedSelection.current = true;

    const defaults = expenseCategories.filter((c) => c.isDefault);
    setSelectedCategoryIds((defaults.length > 0 ? defaults : expenseCategories).map((c) => c.id));
  }, [expenseCategories]);

  const { data: summary } = useExpenseByCategory({
    from: new Date(from),
    to: new Date(new Date(to).setHours(23, 59, 59, 999)),
    categoryIds: selectedCategoryIds,
  });
  const byCategory = summary?.byCategory ?? [];
  const otherTotal = summary?.otherTotal ?? 0;

  // Colors are assigned from a stable, filter-independent order so a category
  // keeps the same color whether or not other categories are selected. Every
  // category gets a color (cycling the palette past 8) so a selected category
  // is always shown under its own name instead of collapsing into "Other".
  const colorByCategoryId = useMemo(() => {
    const sorted = [...expenseCategories].sort((a, b) =>
      a.description.localeCompare(b.description),
    );
    return new Map(sorted.map((c, i) => [c.id, CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]]));
  }, [expenseCategories]);

  const chartData = useMemo(() => {
    // The backend already scopes byCategory to the selected categories and
    // counts each transaction once toward `otherTotal`, however many
    // non-selected categories it also carries, so there's no double-counting
    // to guard against here.
    const shown = byCategory.filter((e) => e.total > 0);

    return [
      ...shown.map((e) => ({
        description: e.description,
        total: e.total,
        fill: colorByCategoryId.get(e.categoryId) ?? OTHER_COLOR,
      })),
      ...(showOther && otherTotal > 0
        ? [{ description: "Other", total: otherTotal, fill: OTHER_COLOR }]
        : []),
    ].sort((a, b) => b.total - a.total);
  }, [byCategory, otherTotal, colorByCategoryId, showOther]);

  const total = chartData.reduce((sum, d) => sum + d.total, 0);

  const toggleCategory = (id: string, checked: boolean) => {
    setSelectedCategoryIds((current) =>
      checked ? [...current, id] : current.filter((catId) => catId !== id),
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-4">
        <CardTitle>Expenses by category</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-40"
            aria-label="Start date"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-40"
            aria-label="End date"
          />
          <Popover>
            <PopoverTrigger render={<Button variant="outline" />}>
              {selectedCategoryIds.length === expenseCategories.length
                ? "All categories"
                : `${selectedCategoryIds.length} of ${expenseCategories.length} categories`}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              {expenseCategories.length === 0 ? (
                <p className="text-muted-foreground text-sm">No expense categories yet.</p>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {expenseCategories.map((category) => (
                    <div key={category.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`chart-category-${category.id}`}
                        checked={selectedCategoryIds.includes(category.id)}
                        onCheckedChange={(checked) => toggleCategory(category.id, checked === true)}
                      />
                      <Label htmlFor={`chart-category-${category.id}`} className="font-normal">
                        {category.description}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-border mt-3 flex items-center justify-between gap-2 border-t pt-3">
                <Label htmlFor="chart-show-other" className="font-normal">
                  Show "Other" (unselected + uncategorized)
                </Label>
                <Switch id="chart-show-other" checked={showOther} onCheckedChange={setShowOther} />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No expenses for the selected categories and period.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto h-80 w-full max-w-md">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="description"
                    hideLabel
                    formatter={(value, name) => (
                      <div className="flex w-full justify-between gap-4">
                        <span>{name}</span>
                        <span className="font-mono font-medium tabular-nums">
                          {currencyFormatter.format(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="total"
                nameKey="description"
                innerRadius={55}
                outerRadius={100}
                paddingAngle={2}
                label={({ percent }) =>
                  percent != null && percent >= 0.05 ? `${Math.round(percent * 100)}%` : ""
                }
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.description}
                    fill={entry.fill}
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="description" />} />
            </PieChart>
          </ChartContainer>
        )}
        {chartData.length > 0 && (
          <p className="text-muted-foreground mt-2 text-center text-sm">
            Total: {currencyFormatter.format(total)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
