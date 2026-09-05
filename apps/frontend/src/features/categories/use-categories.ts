import { Category$, type CreateCategory, type UpdateCategory } from "@repo/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";

const CATEGORIES_QUERY_KEY = "categories";

export function useCategories() {
  return useQuery({
    queryKey: [CATEGORIES_QUERY_KEY],
    queryFn: async () => {
      const res = await apiClient.api.categories.$get();
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      return data.map((category) => Category$.parse(category));
    },
    staleTime: 30_000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategory) => {
      const res = await apiClient.api.categories.$post({ json: data });
      if (!res.ok) throw new Error("Failed to create category");
      return Category$.parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
      toast.success("Category created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategory }) => {
      const res = await apiClient.api.categories[":id"].$patch({ param: { id }, json: data });
      if (!res.ok) throw new Error("Failed to update category");
      return Category$.parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
      toast.success("Category updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.api.categories[":id"].$delete({ param: { id } });
      if (!res.ok) throw new Error("Failed to delete category");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
      toast.success("Category deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
