import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui";
import type { DashboardWidget } from "@repo/utils";
import { ArrowDown, ArrowUp, MoreVertical, Pencil, Trash2 } from "lucide-react";

import { BucketMonthlyDiffWidget } from "./widgets/bucket-monthly-diff-widget";
import { BucketTrendWidget } from "./widgets/bucket-trend-widget";
import { CategoryPieWidget } from "./widgets/category-pie-widget";
import { CategoryStatWidget } from "./widgets/category-stat-widget";
import { YearTotalsWidget } from "./widgets/year-totals-widget";
import { YearlyBarWidget } from "./widgets/yearly-bar-widget";

function WidgetBody({ config }: { config: DashboardWidget["config"] }) {
  switch (config.type) {
    case "CATEGORY_PIE":
      return <CategoryPieWidget config={config} />;
    case "CATEGORY_STAT":
      return <CategoryStatWidget config={config} />;
    case "BUCKET_TREND":
      return <BucketTrendWidget config={config} />;
    case "YEARLY_BAR":
      return <YearlyBarWidget config={config} />;
    case "BUCKET_MONTHLY_DIFF":
      return <BucketMonthlyDiffWidget config={config} />;
    case "YEAR_TOTALS":
      return <YearTotalsWidget config={config} />;
  }
}

interface DashboardWidgetCardProps {
  widget: DashboardWidget;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
}

export function DashboardWidgetCard({
  widget,
  canMoveUp,
  canMoveDown,
  onEdit,
  onDelete,
  onMove,
}: DashboardWidgetCardProps) {
  return (
    <Card className={widget.width === "HALF" ? "sm:col-span-1" : "sm:col-span-2"}>
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" className="-mt-1 size-8" />}
              aria-label={`Options for ${widget.title}`}
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canMoveUp} onClick={() => onMove(-1)}>
                <ArrowUp className="size-4" />
                Move up
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canMoveDown} onClick={() => onMove(1)}>
                <ArrowDown className="size-4" />
                Move down
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 className="size-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent>
        <WidgetBody config={widget.config} />
      </CardContent>
    </Card>
  );
}
