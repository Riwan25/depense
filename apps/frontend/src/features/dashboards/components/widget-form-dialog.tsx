import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  Label,
  NativeSelect,
  NativeSelectOption,
  Switch,
} from "@repo/ui";
import {
  type Category,
  type DashboardWidget,
  type DashboardWidgetConfig,
  type DashboardWidgetWidth,
  type StatAverage,
  type StatFlow,
  type StatGranularity,
  type StatMetric,
  type StatPeriod,
  type TransactionBucket,
} from "@repo/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useCategories } from "@/features/categories/use-categories";

import { useCreateWidget, useUpdateWidget } from "../use-dashboards";
import {
  AVERAGE_LABELS,
  BUCKETS,
  BUCKET_LABELS,
  FLOW_LABELS,
  METRIC_LABELS,
  WIDGET_BLUEPRINTS,
  type WidgetBlueprint,
} from "../widget-catalog";
import { PeriodPicker } from "./period-picker";

const WIDTH_LABELS: Record<DashboardWidgetWidth, string> = {
  FULL: "Full width",
  HALF: "Half width",
};

function hasCategoryFields(
  config: DashboardWidgetConfig,
): config is Extract<DashboardWidgetConfig, { categoryIds: string[] }> {
  return (
    config.type === "CATEGORY_PIE" ||
    config.type === "CATEGORY_STAT" ||
    config.type === "BUCKET_TREND" ||
    config.type === "BUCKET_MONTHLY_DIFF"
  );
}

function hasBuckets(
  config: DashboardWidgetConfig,
): config is Extract<DashboardWidgetConfig, { buckets: TransactionBucket[] }> {
  return config.type !== "YEARLY_BAR" && config.type !== "YEAR_TOTALS";
}

/** Pinned to a calendar year rather than to a free-form period. */
function isYearScoped(
  config: DashboardWidgetConfig,
): config is Extract<DashboardWidgetConfig, { year?: number | null }> {
  return (
    config.type === "YEARLY_BAR" ||
    config.type === "BUCKET_MONTHLY_DIFF" ||
    config.type === "YEAR_TOTALS"
  );
}

function hasFlow(
  config: DashboardWidgetConfig,
): config is Extract<DashboardWidgetConfig, { flow: StatFlow }> {
  return config.type === "CATEGORY_PIE" || config.type === "CATEGORY_STAT";
}

/**
 * Which categories a widget may be pointed at. Normally a widget counts one
 * side only, so only that side's categories are on offer - but the savings
 * bucket is exempt from the single-type rule (a savings move can carry both
 * income and expense tags), and a trend has no side at all, so both of those
 * get the full list.
 */
function offeredCategories(config: DashboardWidgetConfig, categories: Category[]) {
  if (!hasCategoryFields(config)) return [];
  if (!hasFlow(config) || config.buckets.includes("SAVINGS")) return categories;
  return categories.filter((category) => category.isPositive === (config.flow === "INCOME"));
}

interface WidgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardId: string;
  /** Set when editing; the blueprint picker is hidden in that case. */
  widget?: DashboardWidget | null;
  blueprint?: WidgetBlueprint | null;
}

export function WidgetFormDialog({
  open,
  onOpenChange,
  dashboardId,
  widget,
  blueprint,
}: WidgetFormDialogProps) {
  const isEditing = !!widget;
  const createWidget = useCreateWidget();
  const updateWidget = useUpdateWidget();
  const { data: categories = [] } = useCategories();

  const [title, setTitle] = useState("");
  const [width, setWidth] = useState<DashboardWidgetWidth>("FULL");
  const [config, setConfig] = useState<DashboardWidgetConfig>(WIDGET_BLUEPRINTS[0]!.config);
  const [categorySearch, setCategorySearch] = useState("");

  useEffect(() => {
    if (!open) return;
    const source = widget?.config ?? blueprint?.config ?? WIDGET_BLUEPRINTS[0]!.config;
    setTitle(widget?.title ?? blueprint?.defaultTitle ?? "");
    setWidth(widget?.width ?? (source.type === "CATEGORY_STAT" ? "HALF" : "FULL"));
    setConfig(structuredClone(source));
    setCategorySearch("");
  }, [open, widget, blueprint]);

  const available = useMemo(() => offeredCategories(config, categories), [config, categories]);
  const relevantCategories = useMemo(
    () =>
      available.filter((category) =>
        category.description.toLowerCase().includes(categorySearch.trim().toLowerCase()),
      ),
    [available, categorySearch],
  );

  // Changing the flow or the buckets can narrow which categories are on offer;
  // anything no longer offered is dropped rather than silently kept in a
  // config the picker can't show.
  const pruneCategories = (next: DashboardWidgetConfig): DashboardWidgetConfig => {
    if (!hasCategoryFields(next)) return next;
    const offered = new Set(offeredCategories(next, categories).map((category) => category.id));
    return { ...next, categoryIds: next.categoryIds.filter((id) => offered.has(id)) };
  };

  const patch = <T extends DashboardWidgetConfig>(changes: Partial<T>) =>
    setConfig((current) => pruneCategories({ ...current, ...changes } as DashboardWidgetConfig));

  const setPeriod = (period: StatPeriod) => patch({ period });

  const toggleBucket = (bucket: TransactionBucket, checked: boolean) =>
    setConfig((current) => {
      if (!hasBuckets(current)) return current;
      const next = checked
        ? [...current.buckets, bucket]
        : current.buckets.filter((candidate) => candidate !== bucket);
      // A bucket chart with no bucket has nothing to draw, so the last one
      // can't be unchecked.
      if (
        current.type !== "CATEGORY_PIE" &&
        current.type !== "CATEGORY_STAT" &&
        next.length === 0
      ) {
        return current;
      }
      // Dropping the savings bucket re-imposes the single-type rule, so the
      // selection has to be re-checked against it.
      return pruneCategories({ ...current, buckets: next });
    });

  const toggleCategory = (categoryId: string, checked: boolean) =>
    setConfig((current) => {
      if (!hasCategoryFields(current)) return current;
      return {
        ...current,
        categoryIds: checked
          ? [...current.categoryIds, categoryId]
          : current.categoryIds.filter((id) => id !== categoryId),
      };
    });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { title: title.trim(), width, config };

    if (isEditing) {
      await updateWidget.mutateAsync({ dashboardId, widgetId: widget.id, data: payload });
    } else {
      await createWidget.mutateAsync({ dashboardId, data: payload });
    }
    onOpenChange(false);
  };

  const isPending = createWidget.isPending || updateWidget.isPending;
  const selectedCategoryIds = hasCategoryFields(config) ? config.categoryIds : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit widget" : "Add widget"}</DialogTitle>
          <DialogDescription>
            {blueprint?.description ?? "Pick what this widget shows and over which period."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="widget-title">Title</FieldLabel>
            <Input
              id="widget-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Groceries this month"
              required
              maxLength={80}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="widget-width">Size</FieldLabel>
            <NativeSelect
              id="widget-width"
              className="w-full"
              value={width}
              onChange={(event) => setWidth(event.target.value as DashboardWidgetWidth)}
            >
              {(["FULL", "HALF"] as const).map((option) => (
                <NativeSelectOption key={option} value={option}>
                  {WIDTH_LABELS[option]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          {isYearScoped(config) ? (
            <>
              <Field>
                <FieldLabel htmlFor="widget-year">Year</FieldLabel>
                <Input
                  id="widget-year"
                  type="number"
                  value={config.year ?? ""}
                  placeholder={`Current year (${new Date().getFullYear()})`}
                  min={1970}
                  max={2999}
                  onChange={(event) =>
                    patch({ year: event.target.value ? Number(event.target.value) : null })
                  }
                />
              </Field>
              <p className="text-muted-foreground -mt-2 text-xs">
                Where this dashboard opens. Leave empty for the current year. The arrows on the
                cards then move every year-based widget on the page together.
              </p>
              {config.type === "YEARLY_BAR" && (
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="widget-show-savings" className="font-normal">
                    Show the savings bar
                  </Label>
                  <Switch
                    id="widget-show-savings"
                    checked={config.showSavings}
                    onCheckedChange={(checked) => patch({ showSavings: checked })}
                  />
                </div>
              )}
            </>
          ) : (
            <PeriodPicker value={config.period} onChange={setPeriod} />
          )}

          {config.type === "BUCKET_TREND" && (
            <>
              <Field>
                <FieldLabel htmlFor="widget-metric">Shows</FieldLabel>
                <NativeSelect
                  id="widget-metric"
                  className="w-full"
                  value={config.metric}
                  onChange={(event) => patch({ metric: event.target.value as StatMetric })}
                >
                  {(["NET", "BALANCE", "INCOME", "EXPENSE"] as const).map((metric) => (
                    <NativeSelectOption key={metric} value={metric}>
                      {METRIC_LABELS[metric]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="widget-granularity">One point per</FieldLabel>
                <NativeSelect
                  id="widget-granularity"
                  className="w-full"
                  value={config.granularity}
                  onChange={(event) =>
                    patch({ granularity: event.target.value as StatGranularity })
                  }
                >
                  <NativeSelectOption value="DAY">Day</NativeSelectOption>
                  <NativeSelectOption value="MONTH">Month</NativeSelectOption>
                  <NativeSelectOption value="YEAR">Year</NativeSelectOption>
                </NativeSelect>
              </Field>
            </>
          )}

          {hasFlow(config) && (
            <>
              <Field>
                <FieldLabel htmlFor="widget-flow">Counts</FieldLabel>
                <NativeSelect
                  id="widget-flow"
                  className="w-full"
                  value={config.flow}
                  onChange={(event) => patch({ flow: event.target.value as StatFlow })}
                >
                  {(["EXPENSE", "INCOME"] as const).map((flow) => (
                    <NativeSelectOption key={flow} value={flow}>
                      {FLOW_LABELS[flow]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              <Field>
                <FieldLabel htmlFor="widget-average">Figure</FieldLabel>
                <NativeSelect
                  id="widget-average"
                  className="w-full"
                  value={config.average}
                  onChange={(event) => patch({ average: event.target.value as StatAverage })}
                >
                  {(["NONE", "MONTH", "YEAR"] as const).map((average) => (
                    <NativeSelectOption key={average} value={average}>
                      {AVERAGE_LABELS[average]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </>
          )}

          {hasBuckets(config) && (
            <Field>
              <FieldLabel>Buckets</FieldLabel>
              <div className="flex flex-wrap gap-3">
                {BUCKETS.map((bucket) => (
                  <div key={bucket} className="flex items-center gap-2">
                    <Checkbox
                      id={`widget-bucket-${bucket}`}
                      checked={config.buckets.includes(bucket)}
                      onCheckedChange={(checked) => toggleBucket(bucket, checked === true)}
                    />
                    <Label htmlFor={`widget-bucket-${bucket}`} className="font-normal">
                      {BUCKET_LABELS[bucket]}
                    </Label>
                  </div>
                ))}
              </div>
            </Field>
          )}

          {hasCategoryFields(config) && (
            <Field>
              <FieldLabel>Categories ({selectedCategoryIds.length} selected)</FieldLabel>
              {!hasFlow(config) && (
                <p className="text-muted-foreground text-xs">
                  Leave empty to follow the whole bucket. Pick categories to narrow it down to them.
                </p>
              )}
              <Input
                value={categorySearch}
                onChange={(event) => setCategorySearch(event.target.value)}
                placeholder="Search categories"
              />
              <div className="border-border max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
                {relevantCategories.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No matching category.</p>
                ) : (
                  relevantCategories.map((category) => (
                    <div key={category.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`widget-category-${category.id}`}
                        checked={selectedCategoryIds.includes(category.id)}
                        onCheckedChange={(checked) => toggleCategory(category.id, checked === true)}
                      />
                      <Label htmlFor={`widget-category-${category.id}`} className="font-normal">
                        {category.description}
                      </Label>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    patch({ categoryIds: relevantCategories.map((category) => category.id) })
                  }
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => patch({ categoryIds: [] })}
                >
                  Clear
                </Button>
              </div>
            </Field>
          )}

          {config.type === "CATEGORY_PIE" && (
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="widget-include-other" className="font-normal">
                Show "Other" (everything not selected)
              </Label>
              <Switch
                id="widget-include-other"
                checked={config.includeOther}
                onCheckedChange={(checked) => patch({ includeOther: checked })}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || title.trim().length === 0}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEditing ? "Save" : "Add widget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
