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
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
} from "@repo/ui";
import type { Category, CategoryGroup, SavingsTransferDirection } from "@repo/utils";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useCategoryGroups } from "@/features/categories/use-category-groups";

import { useCreateSavingsTransfer } from "../use-transactions";

interface SavingsTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function SavingsTransferDialog({
  open,
  onOpenChange,
  categories,
}: SavingsTransferDialogProps) {
  const createSavingsTransfer = useCreateSavingsTransfer();
  const { data: groups = [] } = useCategoryGroups();

  const [direction, setDirection] = useState<SavingsTransferDirection>("MAIN_TO_SAVINGS");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [comment, setComment] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [groupPopoverOpen, setGroupPopoverOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDirection("MAIN_TO_SAVINGS");
    setValue("");
    setDate(toDateInputValue(new Date()));
    setComment("");
    setCategoryIds([]);
  }, [open]);

  const selectedCategories = categories.filter((category) => categoryIds.includes(category.id));

  const toggleCategory = (category: Category, checked: boolean) => {
    setCategoryIds((current) =>
      checked ? [...current, category.id] : current.filter((id) => id !== category.id),
    );
  };

  const removeCategory = (id: string) => {
    setCategoryIds((current) => current.filter((categoryId) => categoryId !== id));
  };

  const isGroupSelected = (group: CategoryGroup) =>
    group.categories.length > 0 &&
    group.categories.every((member) => categoryIds.includes(member.id));

  const toggleGroup = (group: CategoryGroup, checked: boolean) => {
    const memberIds = group.categories.map((member) => member.id);
    setCategoryIds((current) =>
      checked
        ? Array.from(new Set([...current, ...memberIds]))
        : current.filter((id) => !memberIds.includes(id)),
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await createSavingsTransfer.mutateAsync({
      direction,
      value: Number(value),
      date: new Date(date).toISOString(),
      comment: comment.trim() || undefined,
      categoryIds,
    });

    onOpenChange(false);
  };

  const isValid = Number(value) > 0 && date;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer to/from savings</DialogTitle>
          <DialogDescription>
            Move money between your main balance and your savings balance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel>Direction</FieldLabel>
            <ToggleGroup
              value={[direction]}
              onValueChange={(values) => {
                const next = values[0] as SavingsTransferDirection | undefined;
                if (next) setDirection(next);
              }}
              className="w-full"
            >
              <ToggleGroupItem value="MAIN_TO_SAVINGS" className="flex-1">
                Main → Savings
              </ToggleGroupItem>
              <ToggleGroupItem value="SAVINGS_TO_MAIN" className="flex-1">
                Savings → Main
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>

          <Field>
            <FieldLabel>Categories (optional)</FieldLabel>
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedCategories.map((category) => (
                  <Badge key={category.id} variant="secondary" className="gap-1 font-normal">
                    {category.description}
                    <button
                      type="button"
                      onClick={() => removeCategory(category.id)}
                      aria-label={`Remove ${category.description}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                <PopoverTrigger render={<Button type="button" variant="outline" />}>
                  Add category
                </PopoverTrigger>
                <PopoverContent align="start">
                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {categories.length === 0 ? (
                      <p className="text-muted-foreground py-2 text-sm">No categories found.</p>
                    ) : (
                      categories.map((category) => (
                        <div key={category.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`transfer-category-${category.id}`}
                            checked={categoryIds.includes(category.id)}
                            onCheckedChange={(checked) =>
                              toggleCategory(category, checked === true)
                            }
                          />
                          <Label
                            htmlFor={`transfer-category-${category.id}`}
                            className="font-normal"
                          >
                            {category.description}
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
                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {groups.length === 0 ? (
                      <p className="text-muted-foreground py-2 text-sm">No groups found.</p>
                    ) : (
                      groups.map((group) => (
                        <div key={group.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`transfer-group-${group.id}`}
                            checked={isGroupSelected(group)}
                            onCheckedChange={(checked) => toggleGroup(group, checked === true)}
                          />
                          <Label htmlFor={`transfer-group-${group.id}`} className="font-normal">
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

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="transfer-date">Date</FieldLabel>
              <Input
                id="transfer-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="transfer-value">Amount</FieldLabel>
              <Input
                id="transfer-value"
                type="number"
                step="0.01"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
                required
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="transfer-comment">Comment (optional)</FieldLabel>
            <Textarea
              id="transfer-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Extra context for this transfer"
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || createSavingsTransfer.isPending}>
              {createSavingsTransfer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transfer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
