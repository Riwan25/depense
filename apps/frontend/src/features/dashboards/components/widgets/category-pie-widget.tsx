import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@repo/ui";
import type { CategoryPieWidgetConfig } from "@repo/utils";
import { useMemo } from "react";
import { Cell, Pie, PieChart } from "recharts";

import { useCategories } from "@/features/categories/use-categories";
import { resolvePeriod } from "@/features/dashboards/period";
import { useStatsByCategory } from "@/features/dashboards/use-stats";
import {
  AVERAGE_SUFFIX,
  CATEGORICAL_COLORS,
  OTHER_COLOR,
  currencyFormatter,
} from "@/features/dashboards/widget-catalog";

const chartConfig = {} satisfies ChartConfig;

export function CategoryPieWidget({ config }: { config: CategoryPieWidgetConfig }) {
  const { data: categories = [] } = useCategories();
  const period = resolvePeriod(config.period);

  const { data: summary, isPending } = useStatsByCategory({
    from: period.from,
    to: period.to,
    categoryIds: config.categoryIds,
    buckets: config.buckets,
    flow: config.flow,
    average: config.average,
  });

  // Colors come from a stable, filter-independent order so a category keeps
  // the same color across widgets and across selection changes.
  const colorByCategoryId = useMemo(() => {
    const sorted = [...categories]
      .filter((category) => category.isPositive === (config.flow === "INCOME"))
      .sort((a, b) => a.description.localeCompare(b.description));
    return new Map(
      sorted.map((c, i) => [c.id, CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]!]),
    );
  }, [categories, config.flow]);

  const chartData = useMemo(() => {
    const shown = (summary?.byCategory ?? []).filter((entry) => entry.total > 0);
    const otherTotal = summary?.otherTotal ?? 0;

    return [
      ...shown.map((entry) => ({
        description: entry.description,
        total: entry.total,
        fill: colorByCategoryId.get(entry.categoryId) ?? OTHER_COLOR,
      })),
      ...(config.includeOther && otherTotal > 0
        ? [{ description: "Other", total: otherTotal, fill: OTHER_COLOR }]
        : []),
    ].sort((a, b) => b.total - a.total);
  }, [summary, colorByCategoryId, config.includeOther]);

  const total = chartData.reduce((sum, entry) => sum + entry.total, 0);
  const suffix = AVERAGE_SUFFIX[config.average];

  if (isPending) {
    return <p className="text-muted-foreground py-8 text-center text-sm">Loading…</p>;
  }

  if (config.categoryIds.length === 0 && !config.includeOther) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Pick at least one category in the widget settings.
      </p>
    );
  }

  if (chartData.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nothing to show for {period.label.toLowerCase()}.
      </p>
    );
  }

  return (
    <>
      <ChartContainer config={chartConfig} className="mx-auto h-64 w-full max-w-md sm:h-72">
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
                      {suffix}
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
            innerRadius={50}
            outerRadius={92}
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
      <p className="text-muted-foreground mt-2 text-center text-sm">
        Total: {currencyFormatter.format(total)}
        {suffix}
      </p>
    </>
  );
}
