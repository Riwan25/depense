import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
} from "@repo/ui";
import type { Category, CategoryGroup } from "@repo/utils";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Loader2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useCategories, useCreateCategory, useUpdateCategory } from "../use-categories";
import { useCategoryGroups } from "../use-category-groups";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  const isEditing = !!category;
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const { data: categories = [] } = useCategories();
  const { data: groups = [] } = useCategoryGroups();

  const [description, setDescription] = useState("");
  const [isPositive, setIsPositive] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [subCategoryIds, setSubCategoryIds] = useState<string[]>([]);

  const [subCategoryPopoverOpen, setSubCategoryPopoverOpen] = useState(false);
  const [subCategorySearch, setSubCategorySearch] = useState("");
  const subCategorySearchInputRef = useRef<HTMLInputElement>(null);

  const [groupPopoverOpen, setGroupPopoverOpen] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const groupSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setDescription(category?.description ?? "");
    setIsPositive(category?.isPositive ?? false);
    setIsDefault(category?.isDefault ?? false);
    setSubCategoryIds(
      category?.group?.categories.filter((c) => c.id !== category.id).map((c) => c.id) ?? [],
    );
    setSubCategorySearch("");
    setGroupSearch("");
  }, [open, category]);

  // Pressing "/" while a picker is open jumps straight into its search box.
  useHotkey(
    "/",
    (event) => {
      event.preventDefault();
      subCategorySearchInputRef.current?.focus();
    },
    { enabled: open && subCategoryPopoverOpen },
  );
  useHotkey(
    "/",
    (event) => {
      event.preventDefault();
      groupSearchInputRef.current?.focus();
    },
    { enabled: open && groupPopoverOpen },
  );

  const availableSubCategories = useMemo(
    () => categories.filter((c) => c.id !== category?.id && c.isPositive === isPositive),
    [categories, category, isPositive],
  );
  const filteredSubCategories = useMemo(
    () =>
      availableSubCategories.filter((c) =>
        c.description.toLowerCase().includes(subCategorySearch.trim().toLowerCase()),
      ),
    [availableSubCategories, subCategorySearch],
  );

  const availableGroups = useMemo(
    () =>
      groups.filter(
        (group) =>
          group.mainCategoryId !== category?.id && group.categories[0]?.isPositive === isPositive,
      ),
    [groups, category, isPositive],
  );
  const filteredGroups = useMemo(
    () =>
      availableGroups.filter((group) =>
        group.name.toLowerCase().includes(groupSearch.trim().toLowerCase()),
      ),
    [availableGroups, groupSearch],
  );

  const selectedSubCategories = categories.filter(
    (c) => c.id !== category?.id && subCategoryIds.includes(c.id),
  );

  const toggleSubCategory = (id: string, checked: boolean) => {
    setSubCategoryIds((current) =>
      checked ? [...current, id] : current.filter((subId) => subId !== id),
    );
  };

  const removeSubCategory = (id: string) => {
    setSubCategoryIds((current) => current.filter((subId) => subId !== id));
  };

  const groupMemberIds = (group: CategoryGroup) =>
    group.categories.filter((member) => member.id !== category?.id).map((member) => member.id);

  const isGroupSelected = (group: CategoryGroup) => {
    const memberIds = groupMemberIds(group);
    return memberIds.length > 0 && memberIds.every((id) => subCategoryIds.includes(id));
  };

  const toggleGroup = (group: CategoryGroup, checked: boolean) => {
    const memberIds = groupMemberIds(group);
    setSubCategoryIds((current) =>
      checked
        ? Array.from(new Set([...current, ...memberIds]))
        : current.filter((id) => !memberIds.includes(id)),
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = { description: description.trim(), isPositive, isDefault, subCategoryIds };

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

          <Field orientation="horizontal">
            <FieldLabel htmlFor="category-is-default">
              Show by default on the expense chart
            </FieldLabel>
            <Switch id="category-is-default" checked={isDefault} onCheckedChange={setIsDefault} />
          </Field>

          <Field>
            <FieldLabel>Sub-categories (optional)</FieldLabel>
            <p className="text-muted-foreground text-sm">
              Picking any creates a "{description.trim() || "..."}" group containing this category
              and the ones you pick.
            </p>

            {selectedSubCategories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedSubCategories.map((sub) => (
                  <Badge key={sub.id} variant="secondary" className="gap-1 font-normal">
                    {sub.description}
                    <button
                      type="button"
                      onClick={() => removeSubCategory(sub.id)}
                      aria-label={`Remove ${sub.description}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Popover open={subCategoryPopoverOpen} onOpenChange={setSubCategoryPopoverOpen}>
                <PopoverTrigger render={<Button type="button" variant="outline" />}>
                  Add category
                </PopoverTrigger>
                <PopoverContent align="start">
                  <Input
                    ref={subCategorySearchInputRef}
                    value={subCategorySearch}
                    onChange={(e) => setSubCategorySearch(e.target.value)}
                    placeholder="Search categories... (press / to focus)"
                  />
                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {filteredSubCategories.length === 0 ? (
                      <p className="text-muted-foreground py-2 text-sm">No categories found.</p>
                    ) : (
                      filteredSubCategories.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`sub-category-${sub.id}`}
                            checked={subCategoryIds.includes(sub.id)}
                            onCheckedChange={(checked) =>
                              toggleSubCategory(sub.id, checked === true)
                            }
                          />
                          <Label htmlFor={`sub-category-${sub.id}`} className="font-normal">
                            {sub.description}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover open={groupPopoverOpen} onOpenChange={setGroupPopoverOpen}>
                <PopoverTrigger render={<Button type="button" variant="outline" />}>
                  Add group
                </PopoverTrigger>
                <PopoverContent align="start">
                  <Input
                    ref={groupSearchInputRef}
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    placeholder="Search groups... (press / to focus)"
                  />
                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {filteredGroups.length === 0 ? (
                      <p className="text-muted-foreground py-2 text-sm">No groups found.</p>
                    ) : (
                      filteredGroups.map((group) => (
                        <div key={group.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`sub-group-${group.id}`}
                            checked={isGroupSelected(group)}
                            onCheckedChange={(checked) => toggleGroup(group, checked === true)}
                          />
                          <Label htmlFor={`sub-group-${group.id}`} className="font-normal">
                            {group.name}{" "}
                            <span className="text-muted-foreground">
                              ({group.categories.length} categories)
                            </span>
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
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
