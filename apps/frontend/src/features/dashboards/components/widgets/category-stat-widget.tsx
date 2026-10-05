import type { CategoryStatWidgetConfig } from "@repo/utils";

import { useCategories } from "@/features/categories/use-categories";
import { resolvePeriod } from "@/features/dashboards/period";
import { useStatsByCategory } from "@/features/dashboards/use-stats";
import {
  AVERAGE_LABELS,
  AVERAGE_SUFFIX,
  FLOW_LABELS,
  currencyFormatter,
} from "@/features/dashboards/widget-catalog";

export function CategoryStatWidget({ config }: { config: CategoryStatWidgetConfig }) {
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

  if (isPending) {
    return <p className="text-muted-foreground py-6 text-center text-sm">Loading…</p>;
  }

  if (config.categoryIds.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Pick at least one category in the widget settings.
      </p>
    );
  }

  // A transaction tagged with two selected categories counts toward both, so
  // summing the entries deliberately matches what the pie chart shows rather
  // than a de-duplicated grand total.
  const value = (summary?.byCategory ?? []).reduce((sum, entry) => sum + entry.total, 0);
  const selected = categories.filter((category) => config.categoryIds.includes(category.id));
  const names =
    selected.length === 0
      ? "—"
      : selected.length <= 2
        ? selected.map((category) => category.description).join(" + ")
        : `${selected.length} categories`;

  return (
    <div>
      <p className="text-2xl font-bold tabular-nums sm:text-3xl">
        {currencyFormatter.format(value)}
        <span className="text-muted-foreground text-base font-medium">
          {AVERAGE_SUFFIX[config.average]}
        </span>
      </p>
      <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
        {FLOW_LABELS[config.flow]} · {names} · {period.label}
      </p>
      {config.average !== "NONE" && summary && (
        <p className="text-muted-foreground mt-0.5 text-xs">
          {AVERAGE_LABELS[config.average]} over{" "}
          {config.average === "MONTH"
            ? `${Math.round(summary.divisor)} month${summary.divisor === 1 ? "" : "s"}`
            : `${summary.divisor.toFixed(1)} year${summary.divisor === 1 ? "" : "s"}`}
        </p>
      )}
    </div>
  );
}
