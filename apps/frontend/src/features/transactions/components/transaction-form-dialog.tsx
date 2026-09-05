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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@repo/ui";
import type { Category, CreateTransactionInput, TransactionWithCategory } from "@repo/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useCreateTransaction, useUpdateTransaction } from "../use-transactions";

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  transaction?: TransactionWithCategory | null;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

const NO_CATEGORY = "none";

export function TransactionFormDialog({
  open,
  onOpenChange,
  categories,
  transaction,
}: TransactionFormDialogProps) {
  const isEditing = !!transaction;
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const [description, setDescription] = useState("");
  const [comment, setComment] = useState("");
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [value, setValue] = useState("");
  const [categoryId, setCategoryId] = useState(NO_CATEGORY);
  const [isChequeRepas, setIsChequeRepas] = useState(false);

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
      setCategoryId(transaction.categoryId ?? NO_CATEGORY);
      setIsChequeRepas(transaction.isChequeRepas);
      autoFilledDescriptionRef.current = "";
    } else {
      setDescription("");
      setComment("");
      setDate(toDateInputValue(new Date()));
      setValue("");
      setCategoryId(NO_CATEGORY);
      setIsChequeRepas(false);
      autoFilledDescriptionRef.current = "";
    }
  }, [open, transaction]);

  const handleCategoryChange = (nextCategoryId: string) => {
    setCategoryId(nextCategoryId);

    const category = categories.find((c) => c.id === nextCategoryId);
    if (!category) return;

    if (description.trim() === "" || description === autoFilledDescriptionRef.current) {
      setDescription(category.description);
      autoFilledDescriptionRef.current = category.description;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data: CreateTransactionInput = {
      description: description.trim(),
      comment: comment.trim() || undefined,
      date: new Date(date).toISOString(),
      value: Number(value),
      categoryId: categoryId === NO_CATEGORY ? null : categoryId,
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
            <FieldLabel htmlFor="transaction-category">Category (optional)</FieldLabel>
            <Select
              value={categoryId}
              onValueChange={(value) => handleCategoryChange(value ?? NO_CATEGORY)}
              items={[
                { value: NO_CATEGORY, label: "No category" },
                ...categories.map((category) => ({
                  value: category.id,
                  label: `${category.description} ${category.isPositive ? "(income)" : "(expense)"}`,
                })),
              ]}
            >
              <SelectTrigger id="transaction-category">
                <SelectValue placeholder="No category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.description} {category.isPositive ? "(income)" : "(expense)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

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
