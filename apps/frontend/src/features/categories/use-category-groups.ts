import { CategoryGroup$ } from "@repo/utils";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function useCategoryGroups() {
  return useQuery({
    queryKey: ["category-groups"],
    queryFn: async () => {
      const res = await apiClient.api["category-groups"].$get();
      if (!res.ok) throw new Error("Failed to fetch category groups");
      const data = await res.json();
      return data.map((group) => CategoryGroup$.parse(group));
    },
    staleTime: 30_000,
  });
}
