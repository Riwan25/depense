import { Button, cn } from "@repo/ui";
import type { Dashboard } from "@repo/utils";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

interface DashboardTabsProps {
  dashboards: Dashboard[];
  activeId?: string;
  onCreate: () => void;
}

export function DashboardTabs({ dashboards, activeId, onCreate }: DashboardTabsProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {dashboards.map((dashboard) => (
        <Link
          key={dashboard.id}
          to="/dashboards/$dashboardId"
          params={{ dashboardId: dashboard.id }}
          className={cn(
            "text-muted-foreground hover:text-foreground hover:bg-accent/60 shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            dashboard.id === activeId && "bg-accent text-foreground",
          )}
        >
          {dashboard.name}
        </Link>
      ))}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        aria-label="New dashboard"
        onClick={onCreate}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
