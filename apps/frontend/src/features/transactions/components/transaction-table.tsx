import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import type { TransactionBucket, TransactionWithCategories } from "@repo/utils";
import { Pencil, Trash2 } from "lucide-react";
import { Fragment, useState } from "react";

import { useDeleteTransaction } from "../use-transactions";

interface TransactionTableProps {
  transactions: TransactionWithCategories[];
  onEdit: (transaction: TransactionWithCategories) => void;
}

const currencyFormatter = new Intl.NumberFormat("fr-BE", {
  style: "currency",
  currency: "EUR",
});

function formatSignedValue(value: number, isPositive: boolean) {
  const signed = isPositive ? value : -value;
  return currencyFormatter.format(signed);
}

const bucketRowClass: Record<TransactionBucket, string | undefined> = {
  MAIN: undefined,
  CHEQUE_REPAS: "bg-amber-50 dark:bg-amber-500/10",
  SAVINGS: "bg-sky-50 dark:bg-sky-500/10",
};

function amountClass(isPositive: boolean) {
  return isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
}

function BucketBadges({ transaction }: { transaction: TransactionWithCategories }) {
  return (
    <>
      {transaction.bucket === "CHEQUE_REPAS" && (
        <Badge variant="outline" className="border-amber-400/60 text-amber-700 dark:text-amber-400">
          Cheque repas
        </Badge>
      )}
      {transaction.bucket === "SAVINGS" && (
        <Badge variant="outline" className="border-sky-400/60 text-sky-700 dark:text-sky-400">
          Savings
        </Badge>
      )}
      {transaction.transferGroupId && (
        <Badge variant="secondary" className="font-normal">
          Transfer
        </Badge>
      )}
    </>
  );
}

function CategoryBadges({ transaction }: { transaction: TransactionWithCategories }) {
  if (transaction.categories.length === 0) {
    return <span className="text-muted-foreground text-sm">Uncategorized</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {transaction.categories.map((category) => (
        <Badge key={category.id} variant="secondary" className="font-normal">
          {category.description}
        </Badge>
      ))}
    </div>
  );
}

export function TransactionTable({ transactions, onEdit }: TransactionTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteTransaction = useDeleteTransaction();

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteTransaction.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const toggleExpanded = (id: string) => setExpandedId((current) => (current === id ? null : id));

  if (transactions.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed py-10 text-center text-sm">
        No transactions yet.
      </p>
    );
  }

  return (
    <>
      {/* Mobile: one card per transaction — a five column table does not fit a phone. */}
      <div className="flex flex-col gap-2 md:hidden">
        {transactions.map((transaction) => {
          const isExpanded = expandedId === transaction.id;
          return (
            <div
              key={transaction.id}
              onClick={() => toggleExpanded(transaction.id)}
              className={cn(
                "bg-card ring-foreground/10 cursor-pointer rounded-xl p-3 ring-1",
                bucketRowClass[transaction.bucket],
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{transaction.description}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(transaction.date).toLocaleDateString("fr-BE")}
                  </p>
                </div>
                <p
                  className={cn(
                    "shrink-0 font-medium tabular-nums",
                    amountClass(transaction.isPositive),
                  )}
                >
                  {formatSignedValue(transaction.value, transaction.isPositive)}
                </p>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1">
                <BucketBadges transaction={transaction} />
                <CategoryBadges transaction={transaction} />
              </div>

              {isExpanded && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-muted-foreground text-sm">
                    {transaction.comment || "No additional comment."}
                  </p>
                  <div className="mt-3 flex gap-2">
                    {!transaction.transferGroupId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(transaction);
                        }}
                      >
                        <Pencil className="size-4" />
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(transaction.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: full table. */}
      <div className="ring-foreground/10 hidden overflow-hidden rounded-xl ring-1 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const isExpanded = expandedId === transaction.id;
              return (
                <Fragment key={transaction.id}>
                  <TableRow
                    onClick={() => toggleExpanded(transaction.id)}
                    className={cn("cursor-pointer", bucketRowClass[transaction.bucket])}
                  >
                    <TableCell className="whitespace-nowrap">
                      {new Date(transaction.date).toLocaleDateString("fr-BE")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        {transaction.description}
                        <BucketBadges transaction={transaction} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <CategoryBadges transaction={transaction} />
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium tabular-nums whitespace-nowrap",
                        amountClass(transaction.isPositive),
                      )}
                    >
                      {formatSignedValue(transaction.value, transaction.isPositive)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!transaction.transferGroupId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit transaction"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(transaction);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete transaction"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(transaction.id);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={5} className="text-muted-foreground text-sm">
                        {transaction.comment || "No additional comment."}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
