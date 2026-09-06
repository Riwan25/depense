import { Button, Card, CardContent, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui";
import type { TransactionWithCategories } from "@repo/utils";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";

import { useCategories } from "@/features/categories/use-categories";
import { TransactionFormDialog } from "@/features/transactions/components/transaction-form-dialog";
import { TransactionTable } from "@/features/transactions/components/transaction-table";
import { useTransactions, useTransactionSummary } from "@/features/transactions/use-transactions";
import { signOut, useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
  component: Index,
});

const PAGE_SIZE = 25;

const currencyFormatter = new Intl.NumberFormat("fr-BE", {
  style: "currency",
  currency: "EUR",
});

function Index() {
  const { data: session } = useSession();
  const navigate = useNavigate();

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
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

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          {session?.user && (
            <p className="text-muted-foreground text-sm">Signed in as {session.user.email}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
          <Link to="/categories">
            <Button variant="outline">Categories</Button>
          </Link>
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Main balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {currencyFormatter.format(summary?.mainBalance ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Cheque repas balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {currencyFormatter.format(summary?.chequeRepasBalance ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Select
          value={categoryFilter}
          onValueChange={(value) => setCategoryFilter(value ?? "all")}
          items={[
            { value: "all", label: "All categories" },
            ...categories.map((category) => ({ value: category.id, label: category.description })),
          ]}
        >
          <SelectTrigger className="w-56">
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

        <Button onClick={handleAdd}>
          <Plus className="size-4" />
          Add transaction
        </Button>
      </div>

      <TransactionTable transactions={data?.transactions ?? []} onEdit={handleEdit} />

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={categories}
        transaction={editingTransaction}
      />
    </div>
  );
}
