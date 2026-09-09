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
  Textarea,
} from "@repo/ui";
import type {
  Category,
  CategoryGroup,
  CreateTransactionInput,
  TransactionWithCategories,
} from "@repo/utils";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Loader2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useCategoryGroups } from "@/features/categories/use-category-groups";

import { useCreateTransaction, useUpdateTransaction } from "../use-transactions";

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  transaction?: TransactionWithCategories | null;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  categories,
  transaction,
}: TransactionFormDialogProps) {
  const isEditing = !!transaction;
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const { data: groups = [] } = useCategoryGroups();

  const [description, setDescription] = useState("");
  const [comment, setComment] = useState("");
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [value, setValue] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [isPositive, setIsPositive] = useState(false);
  const [isChequeRepas, setIsChequeRepas] = useState(false);

  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const categorySearchInputRef = useRef<HTMLInputElement>(null);

  const [groupPopoverOpen, setGroupPopoverOpen] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const groupSearchInputRef = useRef<HTMLInputElement>(null);

  // Tracks the description we auto-filled from a category, so we stop
  // overwriting it once the user has typed their own description.
  const autoFilledDescriptionRef = useRef("");

  useEffect(() => {
    if (!open) return;

    if (transaction) {
      setDescription(transaction.description);
      setComment(transaction.comment ?? "");
      setDate(toDateInputValue(transaction.date));
      setValue(String(transaction.value));
      setCategoryIds(transaction.categories.map((category) => category.id));
      setIsPositive(transaction.isPositive);
      setIsChequeRepas(transaction.isChequeRepas);
      autoFilledDescriptionRef.current = "";
    } else {
      setDescription("");
      setComment("");
      setDate(toDateInputValue(new Date()));
      setValue("");
      setCategoryIds([]);
      setIsPositive(false);
      setIsChequeRepas(false);
      autoFilledDescriptionRef.current = "";
    }
    setCategorySearch("");
    setGroupSearch("");
  }, [open, transaction]);

  // Pressing "/" while a picker is open jumps straight into its search box.
  useHotkey(
    "/",
    (event) => {
      event.preventDefault();
      categorySearchInputRef.current?.focus();
    },
    { enabled: open && categoryPopoverOpen },
  );
  useHotkey(
    "/",
    (event) => {
      event.preventDefault();
      groupSearchInputRef.current?.focus();
    },
    { enabled: open && groupPopoverOpen },
  );

  const maybeAutoFillDescription = (nextDescription: string) => {
    if (description.trim() === "" || description === autoFilledDescriptionRef.current) {
      setDescription(nextDescription);
      autoFilledDescriptionRef.current = nextDescription;
    }
  };

  // A transaction's categories must all be income or all be expense, so once
  // any category is picked, the pickers only offer more of the same type and
  // the income/expense switch is locked to match.
  const selectedType = useMemo(() => {
    const selected = categories.find((category) => categoryIds.includes(category.id));
    return selected?.isPositive ?? null;
  }, [categories, categoryIds]);

  useEffect(() => {
    if (selectedType !== null) setIsPositive(selectedType);
  }, [selectedType]);

  const availableCategories = useMemo(
    () =>
      categories.filter(
        (category) => selectedType === null || category.isPositive === selectedType,
      ),
    [categories, selectedType],
  );
  const filteredCategories = useMemo(
    () =>
      availableCategories.filter((category) =>
        category.description.toLowerCase().includes(categorySearch.trim().toLowerCase()),
      ),
    [availableCategories, categorySearch],
  );

  const availableGroups = useMemo(
    () =>
      groups.filter(
        (group) => selectedType === null || group.categories[0]?.isPositive === selectedType,
      ),
    [groups, selectedType],
  );
  const filteredGroups = useMemo(
    () =>
      availableGroups.filter((group) =>
        group.name.toLowerCase().includes(groupSearch.trim().toLowerCase()),
      ),
    [availableGroups, groupSearch],
  );

  const selectedCategories = categories.filter((category) => categoryIds.includes(category.id));

  const toggleCategory = (category: Category, checked: boolean) => {
    setCategoryIds((current) =>
      checked ? [...current, category.id] : current.filter((id) => id !== category.id),
    );
    if (checked) maybeAutoFillDescription(category.description);
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
    if (checked) maybeAutoFillDescription(group.name);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data: CreateTransactionInput = {
      description: description.trim(),
      comment: comment.trim() || undefined,
      date: new Date(date).toISOString(),
      value: Number(value),
      categoryIds,
      isPositive,
      isChequeRepas,
    };

    if (isEditing && transaction) {
      await updateTransaction.mutateAsync({ id: transaction.id, data });
    } else {
      await createTransaction.mutateAsync(data);
    }

    onOpenChange(false);
  };

  const isPending = createTransaction.isPending || updateTransaction.isPending;
  const isValid = description.trim() && Number(value) > 0 && date;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit transaction" : "Add transaction"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the details of this transaction" : "Record a new transaction"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="transaction-description">Description</FieldLabel>
            <Input
              id="transaction-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Carrefour"
              required
            />
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
                  <Input
                    ref={categorySearchInputRef}
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search categories... (press / to focus)"
                  />
                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {filteredCategories.length === 0 ? (
                      <p className="text-muted-foreground py-2 text-sm">No categories found.</p>
                    ) : (
                      filteredCategories.map((category) => (
                        <div key={category.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`transaction-category-${category.id}`}
                            checked={categoryIds.includes(category.id)}
                            onCheckedChange={(checked) =>
                              toggleCategory(category, checked === true)
                            }
                          />
                          <Label
                            htmlFor={`transaction-category-${category.id}`}
                            className="font-normal"
                          >
                            {category.description} {category.isPositive ? "(income)" : "(expense)"}
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
                            id={`transaction-group-${group.id}`}
                            checked={isGroupSelected(group)}
                            onCheckedChange={(checked) => toggleGroup(group, checked === true)}
                          />
                          <Label htmlFor={`transaction-group-${group.id}`} className="font-normal">
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

          <Field orientation="horizontal">
            <FieldLabel htmlFor="transaction-is-positive">
              This is income (adds to balance)
            </FieldLabel>
            <Switch
              id="transaction-is-positive"
              checked={isPositive}
              onCheckedChange={setIsPositive}
              disabled={selectedType !== null}
            />
          </Field>
          {selectedType !== null && (
            <p className="text-muted-foreground -mt-2 text-sm">
              Locked to the type of the selected categories.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="transaction-date">Date</FieldLabel>
              <Input
                id="transaction-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="transaction-value">Amount</FieldLabel>
              <Input
                id="transaction-value"
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
            <FieldLabel htmlFor="transaction-comment">Comment (optional)</FieldLabel>
            <Textarea
              id="transaction-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Extra context shown when expanding the transaction"
            />
          </Field>

          <Field orientation="horizontal">
            <FieldLabel htmlFor="transaction-cheque-repas">Paid with cheque repas</FieldLabel>
            <Switch
              id="transaction-cheque-repas"
              checked={isChequeRepas}
              onCheckedChange={setIsChequeRepas}
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save changes" : "Add transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
