import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@repo/ui";
import { Plus } from "lucide-react";

import { WIDGET_BLUEPRINTS, type WidgetBlueprint } from "../widget-catalog";

export function AddWidgetMenu({
  onPick,
  className,
}: {
  onPick: (blueprint: WidgetBlueprint) => void;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button className={className} />}>
        <Plus className="size-4" />
        Add widget
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))]">
        {/* Base UI requires a group around the label - it reads its context. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Pick a widget</DropdownMenuLabel>
          {WIDGET_BLUEPRINTS.map((blueprint) => (
            <DropdownMenuItem
              key={blueprint.key}
              className="flex-col items-start gap-0.5"
              onClick={() => onPick(blueprint)}
            >
              <span className="font-medium">{blueprint.label}</span>
              <span className="text-muted-foreground text-xs">{blueprint.description}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
