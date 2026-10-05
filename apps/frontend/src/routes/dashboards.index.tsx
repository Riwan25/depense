import { Button } from "@repo/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { DashboardFormDialog } from "@/features/dashboards/components/dashboard-form-dialog";
import { useDashboards } from "@/features/dashboards/use-dashboards";

export const Route = createFileRoute("/dashboards/")({
  component: DashboardsIndexPage,
});

function DashboardsIndexPage() {
  const navigate = useNavigate();
  const { data: dashboards = [], isPending } = useDashboards();
  const [formOpen, setFormOpen] = useState(false);

  // The index is only ever a landing spot: once there is a dashboard to show,
  // hand over to it and keep it out of the history stack.
  const firstDashboardId = dashboards[0]?.id;
  useEffect(() => {
    if (!firstDashboardId) return;
    navigate({
      to: "/dashboards/$dashboardId",
      params: { dashboardId: firstDashboardId },
      replace: true,
    });
  }, [firstDashboardId, navigate]);

  return (
    <div className="pb-safe mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-xl font-bold sm:text-2xl">Dashboards</h1>
        <p className="text-muted-foreground text-sm">
          Your own stats pages, built from the widgets you pick.
        </p>
      </div>

      {isPending || firstDashboardId ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
          <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
            <LayoutDashboard className="size-6" />
          </span>
          <div>
            <p className="font-medium">No dashboard yet</p>
            <p className="text-muted-foreground text-sm">
              Create one, then fill it with charts and figures.
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            New dashboard
          </Button>
        </div>
      )}

      <DashboardFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreated={(dashboard) =>
          navigate({
            to: "/dashboards/$dashboardId",
            params: { dashboardId: dashboard.id },
            replace: true,
          })
        }
      />
    </div>
  );
}
