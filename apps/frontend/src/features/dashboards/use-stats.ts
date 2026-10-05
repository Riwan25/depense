import {
  StatsByCategorySummary$,
  StatsSeriesSummary$,
  type StatAverage,
  type StatFlow,
  type StatGranularity,
  type StatMetric,
  type TransactionBucket,
} from "@repo/utils";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export interface StatsByCategoryFilter {
  from?: Date;
  to?: Date;
  categoryIds: string[];
  buckets: TransactionBucket[];
  flow: StatFlow;
  average: StatAverage;
}

export function useStatsByCategory(filter: StatsByCategoryFilter) {
  return useQuery({
    queryKey: [
      "stats-by-category",
      filter.from?.toISOString(),
      filter.to?.toISOString(),
      [...filter.categoryIds].sort(),
      [...filter.buckets].sort(),
      filter.flow,
      filter.average,
    ],
    queryFn: async () => {
      const res = await apiClient.api.stats["by-category"].$get({
        query: {
          ...(filter.from ? { from: filter.from.toISOString() } : {}),
          ...(filter.to ? { to: filter.to.toISOString() } : {}),
          ...(filter.categoryIds.length > 0 ? { categoryIds: filter.categoryIds.join(",") } : {}),
          ...(filter.buckets.length > 0 ? { buckets: filter.buckets.join(",") } : {}),
          flow: filter.flow,
          average: filter.average,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch category stats");
      return StatsByCategorySummary$.parse(await res.json());
    },
    staleTime: 30_000,
  });
}

export interface StatsSeriesFilter {
  from?: Date;
  to?: Date;
  buckets: TransactionBucket[];
  categoryIds?: string[];
  metric: StatMetric;
  granularity: StatGranularity;
}

export function useStatsSeries(filter: StatsSeriesFilter) {
  return useQuery({
    queryKey: [
      "stats-series",
      filter.from?.toISOString(),
      filter.to?.toISOString(),
      [...filter.buckets].sort(),
      [...(filter.categoryIds ?? [])].sort(),
      filter.metric,
      filter.granularity,
    ],
    queryFn: async () => {
      const res = await apiClient.api.stats.series.$get({
        query: {
          ...(filter.from ? { from: filter.from.toISOString() } : {}),
          ...(filter.to ? { to: filter.to.toISOString() } : {}),
          ...(filter.buckets.length > 0 ? { buckets: filter.buckets.join(",") } : {}),
          ...(filter.categoryIds?.length ? { categoryIds: filter.categoryIds.join(",") } : {}),
          metric: filter.metric,
          granularity: filter.granularity,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch series stats");
      return StatsSeriesSummary$.parse(await res.json());
    },
    staleTime: 30_000,
  });
}
