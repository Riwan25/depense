import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui";
import type { DashboardWidget } from "@repo/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { AddWidgetMenu } from "@/features/dashboards/components/add-widget-menu";
import { DashboardFormDialog } from "@/features/dashboards/components/dashboard-form-dialog";
import { DashboardTabs } from "@/features/dashboards/components/dashboard-tabs";
import { DashboardWidgetCard } from "@/features/dashboards/components/dashboard-widget-card";
import { WidgetFormDialog } from "@/features/dashboards/components/widget-form-dialog";
import { DashboardYearProvider } from "@/features/dashboards/dashboard-year";
import {
  useDashboards,
  useDeleteDashboard,
  useDeleteWidget,
  useReorderWidgets,
} from "@/features/dashboards/use-dashboards";
import type { WidgetBlueprint } from "@/features/dashboards/widget-catalog";

export const Route = createFileRoute("/dashboards/$dashboardId")({
  component: DashboardDetailPage,
});

function DashboardDetailPage() {
  const { dashboardId } = Route.useParams();
  const navigate = useNavigate();

  const { data: dashboards = [], isPending } = useDashboards();
  const deleteDashboard = useDeleteDashboard();
  const deleteWidget = useDeleteWidget();
  const reorderWidgets = useReorderWidgets();

  const [dashboardFormOpen, setDashboardFormOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmDeleteDashboard, setConfirmDeleteDashboard] = useState(false);
  const [widgetFormOpen, setWidgetFormOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [blueprint, setBlueprint] = useState<WidgetBlueprint | null>(null);
  const [deletingWidgetId, setDeletingWidgetId] = useState<string | null>(null);

  const dashboard = dashboards.find((entry) => entry.id === dashboardId);
  const widgets = dashboard?.widgets ?? [];

  const handleAddWidget = (picked: WidgetBlueprint) => {
    setEditingWidget(null);
    setBlueprint(picked);
    setWidgetFormOpen(true);
  };

  const handleEditWidget = (widget: DashboardWidget) => {
    setBlueprint(null);
    setEditingWidget(widget);
    setWidgetFormOpen(true);
  };

  const handleMoveWidget = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= widgets.length) return;

    const orderedIds = widgets.map((widget) => widget.id);
    [orderedIds[index], orderedIds[target]] = [orderedIds[target]!, orderedIds[index]!];
    reorderWidgets.mutate({ dashboardId, orderedIds });
  };

  const handleDeleteDashboard = async () => {
    await deleteDashboard.mutateAsync(dashboardId);
    setConfirmDeleteDashboard(false);
    navigate({ to: "/dashboards", replace: true });
  };

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4 p-4 sm:p-6">
        <p className="text-muted-foreground text-sm">This dashboard no longer exists.</p>
        <Button onClick={() => navigate({ to: "/dashboards" })}>Back to dashboards</Button>
      </div>
    );
  }

  return (
    <div className="pb-safe mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <DashboardTabs
        dashboards={dashboards}
        activeId={dashboardId}
        onCreate={() => {
          setRenaming(false);
          setDashboardFormOpen(true);
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold sm:text-2xl">{dashboard.name}</h1>

        <div className="flex items-center gap-2">
          <AddWidgetMenu onPick={handleAddWidget} />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="icon" />}
              aria-label="Dashboard options"
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setRenaming(true);
                  setDashboardFormOpen(true);
                }}
              >
                <Pencil className="size-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmDeleteDashboard(true)}
              >
                <Trash2 className="size-4" />
                Delete dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {widgets.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed py-14 text-center text-sm">
          Nothing here yet. Use “Add widget” to put your first chart on this page.
        </p>
      ) : (
        <DashboardYearProvider key={dashboard.id} widgets={widgets}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {widgets.map((widget, index) => (
              <DashboardWidgetCard
                key={widget.id}
                widget={widget}
                canMoveUp={index > 0}
                canMoveDown={index < widgets.length - 1}
                onEdit={() => handleEditWidget(widget)}
                onDelete={() => setDeletingWidgetId(widget.id)}
                onMove={(direction) => handleMoveWidget(index, direction)}
              />
            ))}
          </div>
        </DashboardYearProvider>
      )}

      <DashboardFormDialog
        open={dashboardFormOpen}
        onOpenChange={setDashboardFormOpen}
        dashboard={renaming ? dashboard : null}
        onCreated={(created) =>
          navigate({ to: "/dashboards/$dashboardId", params: { dashboardId: created.id } })
        }
      />

      <WidgetFormDialog
        open={widgetFormOpen}
        onOpenChange={setWidgetFormOpen}
        dashboardId={dashboardId}
        widget={editingWidget}
        blueprint={blueprint}
      />

      <AlertDialog open={confirmDeleteDashboard} onOpenChange={setConfirmDeleteDashboard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{dashboard.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The page and its {widgets.length} widget{widgets.length === 1 ? "" : "s"} are removed.
              Your transactions are untouched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDashboard}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deletingWidgetId !== null}
        onOpenChange={(open) => !open && setDeletingWidgetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this widget?</AlertDialogTitle>
            <AlertDialogDescription>
              It is taken off this dashboard. Your transactions are untouched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deletingWidgetId) return;
                await deleteWidget.mutateAsync({ dashboardId, widgetId: deletingWidgetId });
                setDeletingWidgetId(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
