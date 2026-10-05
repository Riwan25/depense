import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@repo/ui";
import type { BucketMonthlyDiffWidgetConfig, TransactionBucket } from "@repo/utils";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, XAxis, YAxis } from "recharts";

import { useDashboardYear } from "@/features/dashboards/dashboard-year";
import { useStatsSeries } from "@/features/dashboards/use-stats";
import {
  BUCKET_COLORS,
  BUCKET_LABELS,
  compactCurrencyFormatter,
  currencyFormatter,
} from "@/features/dashboards/widget-catalog";

import { YearStepper } from "./year-stepper";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface BarLabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: number | string;
}

/**
 * Values are written on the bars rather than left to the tooltip. Recharts
 * anchors a negative bar at the zero line and grows it downwards, so the sign
 * decides whether the label sits above or below.
 */
function BarValueLabel({ x, y, width, height, value }: BarLabelProps) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount === 0) return null;

  const left = Number(x);
  const barWidth = Number(width);
  const top = Number(y);
  const barHeight = Number(height);
  const isNegative = amount < 0;

  return (
    <text
      x={left + barWidth / 2}
      y={isNegative ? top + barHeight + 11 : top - 4}
      textAnchor="middle"
      className="fill-foreground text-[10px] font-medium tabular-nums"
    >
      {compactCurrencyFormatter.format(amount)}
    </text>
  );
}

export function BucketMonthlyDiffWidget({ config }: { config: BucketMonthlyDiffWidgetConfig }) {
  const { year, setYear } = useDashboardYear();

  const { data, isPending } = useStatsSeries({
    from: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
    to: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
    buckets: config.buckets,
    categoryIds: config.categoryIds,
    metric: "NET",
    granularity: "MONTH",
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

  // The net figures plus the opening balance give the standing on either side
  // of every month, which is what makes the diff readable: "it went from X to
  // Y, so the month was worth Y - X".
  const { rows, closing } = useMemo(() => {
    const points = data?.points ?? [];
    const running = new Map<TransactionBucket, number>(
      config.buckets.map((bucket) => [bucket, data?.opening?.[bucket] ?? 0]),
    );

    const rows = points.map((point) => {
      const row: Record<string, string | number> = { month: String(point.period) };
      for (const bucket of config.buckets) {
        const diff = Number(point[bucket] ?? 0);
        const before = running.get(bucket) ?? 0;
        running.set(bucket, before + diff);
        row[bucket] = diff;
        row[`${bucket}__before`] = before;
        row[`${bucket}__after`] = before + diff;
      }
      return row;
    });

    return { rows, closing: new Map(running) };
  }, [data, config.buckets]);

  const chartData = useMemo(
    () =>
      rows.map((row, index) => ({
        ...row,
        month: MONTH_LABELS[index] ?? String(row.month),
      })),
    [rows],
  );

  if (isPending) {
    return <p className="text-muted-foreground py-8 text-center text-sm">Loading…</p>;
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <YearStepper year={year} onChange={setYear} />
      </div>

      {chartData.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">No movement in {year}.</p>
      ) : (
        <>
          <ChartContainer config={chartConfig} className="h-64 w-full sm:h-72">
            <BarChart data={chartData} margin={{ left: 0, right: 8, top: 18, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(value: number) => compactCurrencyFormatter.format(value)}
              />
              {/* A month that drew the bucket down sits below this line. */}
              <ReferenceLine y={0} stroke="var(--border)" />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => {
                      const bucket = name as TransactionBucket;
                      const payload = item?.payload as Record<string, number> | undefined;
                      const before = payload?.[`${bucket}__before`] ?? 0;
                      const after = payload?.[`${bucket}__after`] ?? 0;
                      return (
                        <div className="flex w-full flex-col gap-0.5">
                          <div className="flex justify-between gap-4">
                            <span>{BUCKET_LABELS[bucket] ?? name}</span>
                            <span className="font-mono font-medium tabular-nums">
                              {Number(value) > 0 ? "+" : ""}
                              {currencyFormatter.format(Number(value))}
                            </span>
                          </div>
                          <span className="text-muted-foreground text-xs tabular-nums">
                            {currencyFormatter.format(before)} → {currencyFormatter.format(after)}
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              {config.buckets.map((bucket) => (
                <Bar key={bucket} dataKey={bucket} fill={`var(--color-${bucket})`} radius={2}>
                  <LabelList dataKey={bucket} content={<BarValueLabel />} />
                </Bar>
              ))}
            </BarChart>
          </ChartContainer>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            {config.buckets
              .map(
                (bucket) =>
                  `${BUCKET_LABELS[bucket]}: ${currencyFormatter.format(closing.get(bucket) ?? 0)} at end of ${year}`,
              )
              .join(" · ")}
          </p>
        </>
      )}
    </>
  );
}
