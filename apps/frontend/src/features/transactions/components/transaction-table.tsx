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
  CHEQUE_REPAS: "bg-amber-50 dark:bg-amber-950/30",
  SAVINGS: "bg-sky-50 dark:bg-sky-950/30",
};

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

  if (transactions.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">No transactions yet.</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
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
                  onClick={() => setExpandedId(isExpanded ? null : transaction.id)}
                  className={cn("cursor-pointer", bucketRowClass[transaction.bucket])}
                >
                  <TableCell>{new Date(transaction.date).toLocaleDateString("fr-BE")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transaction.description}
                      {transaction.bucket === "CHEQUE_REPAS" && (
                        <Badge
                          variant="outline"
                          className="border-amber-400 text-amber-700 dark:text-amber-400"
                        >
                          Cheque repas
                        </Badge>
                      )}
                      {transaction.bucket === "SAVINGS" && (
                        <Badge
                          variant="outline"
                          className="border-sky-400 text-sky-700 dark:text-sky-400"
                        >
                          Savings
                        </Badge>
                      )}
                      {transaction.transferGroupId && (
                        <Badge variant="secondary" className="font-normal">
                          Transfer
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {transaction.categories.map((category) => (
                          <Badge key={category.id} variant="secondary" className="font-normal">
                            {category.description}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Uncategorized</span>
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium",
                      transaction.isPositive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400",
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
