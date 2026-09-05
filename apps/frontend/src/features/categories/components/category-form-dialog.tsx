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
  Switch,
} from "@repo/ui";
import type { Category } from "@repo/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useCreateCategory, useUpdateCategory } from "../use-categories";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  const isEditing = !!category;
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [description, setDescription] = useState("");
  const [isPositive, setIsPositive] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDescription(category?.description ?? "");
    setIsPositive(category?.isPositive ?? false);
  }, [open, category]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = { description: description.trim(), isPositive };

    if (isEditing && category) {
      await updateCategory.mutateAsync({ id: category.id, data });
    } else {
      await createCategory.mutateAsync(data);
    }

    onOpenChange(false);
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit category" : "Add category"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update this category" : "Create a new income or expense category"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="category-description">Description</FieldLabel>
            <Input
              id="category-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Groceries"
              required
            />
          </Field>

          <Field orientation="horizontal">
            <FieldLabel htmlFor="category-is-positive">This is income (adds to balance)</FieldLabel>
            <Switch
              id="category-is-positive"
              checked={isPositive}
              onCheckedChange={setIsPositive}
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!description.trim() || isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save changes" : "Add category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
