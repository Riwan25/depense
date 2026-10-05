import {
  DEFAULT_STAT_BUCKETS,
  type DashboardWidgetConfig,
  type StatAverage,
  type StatFlow,
  type StatMetric,
  type TransactionBucket,
} from "@repo/utils";

export const BUCKET_LABELS: Record<TransactionBucket, string> = {
  MAIN: "Main",
  CHEQUE_REPAS: "Cheque repas",
  SAVINGS: "Savings",
};

export const BUCKETS = ["MAIN", "CHEQUE_REPAS", "SAVINGS"] as const;

export const FLOW_LABELS: Record<StatFlow, string> = {
  EXPENSE: "Expenses",
  INCOME: "Income",
};

export const AVERAGE_LABELS: Record<StatAverage, string> = {
  NONE: "Total over the period",
  MONTH: "Average per month",
  YEAR: "Average per year",
};

export const AVERAGE_SUFFIX: Record<StatAverage, string> = {
  NONE: "",
  MONTH: " / month",
  YEAR: " / year",
};

export const METRIC_LABELS: Record<StatMetric, string> = {
  NET: "Net movement",
  INCOME: "Money in",
  EXPENSE: "Money out",
  BALANCE: "Running balance",
};

export const CATEGORICAL_COLORS = [
  "var(--chart-cat-1)",
  "var(--chart-cat-2)",
  "var(--chart-cat-3)",
  "var(--chart-cat-4)",
  "var(--chart-cat-5)",
  "var(--chart-cat-6)",
  "var(--chart-cat-7)",
  "var(--chart-cat-8)",
];
export const OTHER_COLOR = "var(--chart-cat-other)";

export const BUCKET_COLORS: Record<TransactionBucket, string> = {
  MAIN: "var(--chart-cat-1)",
  CHEQUE_REPAS: "var(--chart-cat-3)",
  SAVINGS: "var(--chart-cat-7)",
};

export const currencyFormatter = new Intl.NumberFormat("fr-BE", {
  style: "currency",
  currency: "EUR",
});

export const compactCurrencyFormatter = new Intl.NumberFormat("fr-BE", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

/**
 * The "add a snippet" menu. Several entries share a widget type and differ
 * only by their starting config - an average pie is a pie with `average` set -
 * so the picker stays task-shaped while the renderer stays small.
 */
export interface WidgetBlueprint {
  key: string;
  label: string;
  description: string;
  defaultTitle: string;
  config: DashboardWidgetConfig;
}

const defaultPeriod = { preset: "THIS_MONTH" as const, from: null, to: null };

export const WIDGET_BLUEPRINTS: WidgetBlueprint[] = [
  {
    key: "category-pie",
    label: "Pie chart by category",
    description: "How a period splits across the categories you pick.",
    defaultTitle: "Expenses by category",
    config: {
      type: "CATEGORY_PIE",
      period: defaultPeriod,
      categoryIds: [],
      buckets: [...DEFAULT_STAT_BUCKETS],
      flow: "EXPENSE",
      average: "NONE",
      includeOther: false,
    },
  },
  {
    key: "category-pie-average",
    label: "Average pie chart by category",
    description: "Same split, but each slice is an average per month or year.",
    defaultTitle: "Monthly average by category",
    config: {
      type: "CATEGORY_PIE",
      period: { preset: "LAST_12_MONTHS", from: null, to: null },
      categoryIds: [],
      buckets: [...DEFAULT_STAT_BUCKETS],
      flow: "EXPENSE",
      average: "MONTH",
      includeOther: false,
    },
  },
  {
    key: "bucket-trend",
    label: "Line chart by bucket",
    description: "How a bucket moves day by day, as net change or balance.",
    defaultTitle: "Main over time",
    config: {
      type: "BUCKET_TREND",
      period: { preset: "LAST_3_MONTHS", from: null, to: null },
      buckets: ["MAIN"],
      categoryIds: [],
      metric: "BALANCE",
      granularity: "DAY",
    },
  },
  {
    key: "category-stat",
    label: "Single figure",
    description: "One number, e.g. the average €/month of a category.",
    defaultTitle: "Average per month",
    config: {
      type: "CATEGORY_STAT",
      period: { preset: "LAST_12_MONTHS", from: null, to: null },
      categoryIds: [],
      buckets: [...DEFAULT_STAT_BUCKETS],
      flow: "EXPENSE",
      average: "MONTH",
    },
  },
  {
    key: "year-totals",
    label: "Year totals",
    description: "Income, expense and savings for a year, as on the Stats page.",
    defaultTitle: "This year at a glance",
    config: {
      type: "YEAR_TOTALS",
      year: null,
    },
  },
  {
    key: "bucket-monthly-diff",
    label: "Monthly difference bar chart",
    description: "What each month of a year added to or took off a bucket.",
    defaultTitle: "Main month by month",
    config: {
      type: "BUCKET_MONTHLY_DIFF",
      year: null,
      buckets: ["MAIN"],
      categoryIds: [],
    },
  },
  {
    key: "yearly-bar",
    label: "Year bar chart",
    description: "Income, expense and savings month by month, as on Stats.",
    defaultTitle: "Income vs expense",
    config: {
      type: "YEARLY_BAR",
      year: null,
      showSavings: true,
    },
  },
];
