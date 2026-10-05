import {
  Dashboard$,
  DashboardWidget$,
  type CreateDashboard,
  type CreateDashboardWidgetInput,
  type UpdateDashboard,
  type UpdateDashboardWidgetInput,
} from "@repo/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";

const DASHBOARDS_QUERY_KEY = "dashboards";

function useInvalidateDashboards() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [DASHBOARDS_QUERY_KEY] });
}

export function useDashboards() {
  return useQuery({
    queryKey: [DASHBOARDS_QUERY_KEY],
    queryFn: async () => {
      const res = await apiClient.api.dashboards.$get();
      if (!res.ok) throw new Error("Failed to fetch dashboards");
      const data = await res.json();
      return data.map((dashboard) => Dashboard$.parse(dashboard));
    },
    staleTime: 30_000,
  });
}

export function useCreateDashboard() {
  const invalidate = useInvalidateDashboards();

  return useMutation({
    mutationFn: async (data: CreateDashboard) => {
      const res = await apiClient.api.dashboards.$post({ json: data });
      if (!res.ok) throw new Error("Failed to create dashboard");
      return Dashboard$.parse(await res.json());
    },
    onSuccess: () => {
      invalidate();
      toast.success("Dashboard created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateDashboard() {
  const invalidate = useInvalidateDashboards();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDashboard }) => {
      const res = await apiClient.api.dashboards[":id"].$patch({ param: { id }, json: data });
      if (!res.ok) throw new Error("Failed to rename dashboard");
      return Dashboard$.parse(await res.json());
    },
    onSuccess: () => {
      invalidate();
      toast.success("Dashboard renamed");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteDashboard() {
  const invalidate = useInvalidateDashboards();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.api.dashboards[":id"].$delete({ param: { id } });
      if (!res.ok) throw new Error("Failed to delete dashboard");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Dashboard deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateWidget() {
  const invalidate = useInvalidateDashboards();

  return useMutation({
    mutationFn: async ({
      dashboardId,
      data,
    }: {
      dashboardId: string;
      data: CreateDashboardWidgetInput;
    }) => {
      const res = await apiClient.api.dashboards[":id"].widgets.$post({
        param: { id: dashboardId },
        json: data,
      });
      if (!res.ok) throw new Error("Failed to add widget");
      return DashboardWidget$.parse(await res.json());
    },
    onSuccess: () => {
      invalidate();
      toast.success("Widget added");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateWidget() {
  const invalidate = useInvalidateDashboards();

  return useMutation({
    mutationFn: async ({
      dashboardId,
      widgetId,
      data,
    }: {
      dashboardId: string;
      widgetId: string;
      data: UpdateDashboardWidgetInput;
    }) => {
      const res = await apiClient.api.dashboards[":id"].widgets[":widgetId"].$patch({
        param: { id: dashboardId, widgetId },
        json: data,
      });
      if (!res.ok) throw new Error("Failed to update widget");
      return DashboardWidget$.parse(await res.json());
    },
    onSuccess: () => {
      invalidate();
      toast.success("Widget updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteWidget() {
  const invalidate = useInvalidateDashboards();

  return useMutation({
    mutationFn: async ({ dashboardId, widgetId }: { dashboardId: string; widgetId: string }) => {
      const res = await apiClient.api.dashboards[":id"].widgets[":widgetId"].$delete({
        param: { id: dashboardId, widgetId },
      });
      if (!res.ok) throw new Error("Failed to delete widget");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Widget removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useReorderWidgets() {
  const invalidate = useInvalidateDashboards();

  return useMutation({
    mutationFn: async ({
      dashboardId,
      orderedIds,
    }: {
      dashboardId: string;
      orderedIds: string[];
    }) => {
      const res = await apiClient.api.dashboards[":id"].widgets.order.$patch({
        param: { id: dashboardId },
        json: { orderedIds },
      });
      if (!res.ok) throw new Error("Failed to reorder widgets");
    },
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  });
}
