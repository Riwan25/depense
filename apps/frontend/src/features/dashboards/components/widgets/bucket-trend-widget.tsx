import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@repo/ui";
import type { BucketTrendWidgetConfig, StatGranularity } from "@repo/utils";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

import { resolvePeriod } from "@/features/dashboards/period";
import { useStatsSeries } from "@/features/dashboards/use-stats";
import {
  BUCKET_COLORS,
  BUCKET_LABELS,
  METRIC_LABELS,
  compactCurrencyFormatter,
  currencyFormatter,
} from "@/features/dashboards/widget-catalog";

const GRANULARITY_CAPTIONS: Record<StatGranularity, string> = {
  DAY: "per day",
  MONTH: "per month",
  YEAR: "per year",
};

const dayTickFormatter = new Intl.DateTimeFormat("fr-BE", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

/** Daily keys are "2026-10-05"; only the day and month fit on the axis. */
function formatPeriodTick(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return dayTickFormatter.format(new Date(`${value}T00:00:00.000Z`));
}

export function BucketTrendWidget({ config }: { config: BucketTrendWidgetConfig }) {
  const period = resolvePeriod(config.period);

  const { data, isPending } = useStatsSeries({
    from: period.from,
    to: period.to,
    buckets: config.buckets,
    categoryIds: config.categoryIds,
    metric: config.metric,
    granularity: config.granularity,
  });

  const chartConfig = useMemo(
    () =>
      Object.fromEntries(
        config.buckets.map((bucket) => [
          bucket,
          { label: BUCKET_LABELS[bucket], color: BUCKET_COLORS[bucket] },
        ]),
      ) satisfies ChartConfig,
    [config.buckets],
  );

  if (isPending) {
    return <p className="text-muted-foreground py-8 text-center text-sm">Loading…</p>;
  }

  const points = data?.points ?? [];
  if (points.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No movement for {period.label.toLowerCase()}.
      </p>
    );
  }

  return (
    <>
      <ChartContainer config={chartConfig} className="h-64 w-full sm:h-72">
        <LineChart data={points} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="period"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={32}
            tickMargin={8}
            tickFormatter={formatPeriodTick}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => compactCurrencyFormatter.format(value)}
          />
          {/* Net movement swings either side of zero, so the baseline is worth
              drawing explicitly. */}
          <ReferenceLine y={0} stroke="var(--border)" />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex w-full justify-between gap-4">
                    <span>{BUCKET_LABELS[name as keyof typeof BUCKET_LABELS] ?? name}</span>
                    <span className="font-mono font-medium tabular-nums">
                      {currencyFormatter.format(Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {config.buckets.map((bucket) => (
            <Line
              key={bucket}
              type="monotone"
              dataKey={bucket}
              stroke={`var(--color-${bucket})`}
              strokeWidth={2}
              dot={points.length <= 24}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ChartContainer>
      <p className="text-muted-foreground mt-2 text-center text-sm">
        {METRIC_LABELS[config.metric]} · {GRANULARITY_CAPTIONS[config.granularity]} · {period.label}
      </p>
    </>
  );
}
