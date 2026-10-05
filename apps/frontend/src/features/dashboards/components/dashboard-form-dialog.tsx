import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
} from "@repo/ui";
import type { Dashboard } from "@repo/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useCreateDashboard, useUpdateDashboard } from "../use-dashboards";

interface DashboardFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboard?: Dashboard | null;
  onCreated?: (dashboard: Dashboard) => void;
}

export function DashboardFormDialog({
  open,
  onOpenChange,
  dashboard,
  onCreated,
}: DashboardFormDialogProps) {
  const isEditing = !!dashboard;
  const createDashboard = useCreateDashboard();
  const updateDashboard = useUpdateDashboard();
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(dashboard?.name ?? "");
  }, [open, dashboard]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isEditing) {
      await updateDashboard.mutateAsync({ id: dashboard.id, data: { name: name.trim() } });
    } else {
      const created = await createDashboard.mutateAsync({ name: name.trim() });
      onCreated?.(created);
    }
    onOpenChange(false);
  };

  const isPending = createDashboard.isPending || updateDashboard.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Rename dashboard" : "New dashboard"}</DialogTitle>
          <DialogDescription>
            A dashboard is a page you fill with the widgets you care about.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="dashboard-name">Name</FieldLabel>
            <Input
              id="dashboard-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Monthly overview"
              required
              maxLength={60}
              autoFocus
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || name.trim().length === 0}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEditing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
