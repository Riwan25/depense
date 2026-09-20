import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@repo/ui";
import type { TransactionWithCategories } from "@repo/utils";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeftRight, Plus, PiggyBank, Ticket, Wallet } from "lucide-react";
import { useState } from "react";

import { useCategories } from "@/features/categories/use-categories";
import { SavingsTransferDialog } from "@/features/transactions/components/savings-transfer-dialog";
import { TransactionFormDialog } from "@/features/transactions/components/transaction-form-dialog";
import { TransactionTable } from "@/features/transactions/components/transaction-table";
import { useTransactions, useTransactionSummary } from "@/features/transactions/use-transactions";

export const Route = createFileRoute("/")({
  component: Index,
});

const PAGE_SIZE = 25;

const currencyFormatter = new Intl.NumberFormat("fr-BE", {
  style: "currency",
  currency: "EUR",
});

function Index() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategories | null>(
    null,
  );

  const { data: categories = [] } = useCategories();
  const { data: summary } = useTransactionSummary();
  const { data } = useTransactions({
    categoryId: categoryFilter === "all" ? undefined : categoryFilter,
    page: 1,
    pageSize: PAGE_SIZE,
  });

  const handleAdd = () => {
    setEditingTransaction(null);
    setFormOpen(true);
  };

  const handleEdit = (transaction: TransactionWithCategories) => {
    setEditingTransaction(transaction);
    setFormOpen(true);
  };

  const balances = [
    {
      key: "main",
      label: "Main balance",
      value: summary?.mainBalance ?? 0,
      icon: Wallet,
      accent: "bg-primary/15 text-primary",
    },
    {
      key: "chequeRepas",
      label: "Cheque repas",
      value: summary?.chequeRepasBalance ?? 0,
      icon: Ticket,
      accent: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    },
    {
      key: "savings",
      label: "Savings",
      value: summary?.savingsBalance ?? 0,
      icon: PiggyBank,
      accent: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    },
  ] as const;

  return (
    <div className="pb-safe mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-xl font-bold sm:text-2xl">Expenses</h1>
        <p className="text-muted-foreground text-sm">Your latest transactions and balances.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {balances.map(({ key, label, value, icon: Icon, accent }) => (
          <Card key={key} size="sm">
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
              <span className={cn("flex size-7 items-center justify-center rounded-lg", accent)}>
                <Icon className="size-4" />
              </span>
              <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold tabular-nums sm:text-2xl">
                {currencyFormatter.format(value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select
          value={categoryFilter}
          onValueChange={(value) => setCategoryFilter(value ?? "all")}
          items={[
            { value: "all", label: "All categories" },
            ...categories.map((category) => ({ value: category.id, label: category.description })),
          ]}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => setTransferOpen(true)}
          >
            <ArrowLeftRight className="size-4" />
            <span className="sm:hidden">Transfer</span>
            <span className="hidden sm:inline">Transfer to/from savings</span>
          </Button>
          <Button className="flex-1 sm:flex-none" onClick={handleAdd}>
            <Plus className="size-4" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add transaction</span>
          </Button>
        </div>
      </div>

      <TransactionTable transactions={data?.transactions ?? []} onEdit={handleEdit} />

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={categories}
        transaction={editingTransaction}
      />

      <SavingsTransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        categories={categories}
      />
    </div>
  );
}
