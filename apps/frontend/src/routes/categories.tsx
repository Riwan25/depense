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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import type { Category } from "@repo/utils";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { CategoryFormDialog } from "@/features/categories/components/category-form-dialog";
import { useCategories, useDeleteCategory } from "@/features/categories/use-categories";

export const Route = createFileRoute("/categories")({
  component: CategoriesPage,
});

function CategoryTypeBadges({ category }: { category: Category }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Badge variant={category.isPositive ? "default" : "secondary"}>
        {category.isPositive ? "Income" : "Expense"}
      </Badge>
      {category.isDefault && <Badge variant="outline">Default</Badge>}
    </div>
  );
}

function GroupBadges({ category }: { category: Category }) {
  if (!category.group || category.group.categories.length <= 1) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {category.group.categories
        .filter((member) => member.id !== category.id)
        .map((member) => (
          <Badge key={member.id} variant="outline" className="font-normal">
            {member.description}
          </Badge>
        ))}
    </div>
  );
}

function CategoriesPage() {
  const { data: categories = [], isPending } = useCategories();
  const deleteCategory = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteCategory.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="pb-safe mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold sm:text-2xl">Categories</h1>
          <p className="text-muted-foreground text-sm">Labels used to sort your transactions.</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="size-4" />
          Add category
        </Button>
      </div>

      {isPending ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : categories.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed py-10 text-center text-sm">
          No categories yet. Add one to start tracking transactions.
        </p>
      ) : (
        <>
          {/* Mobile: stacked cards instead of a table. */}
          <div className="flex flex-col gap-2 md:hidden">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-card ring-foreground/10 flex items-start gap-3 rounded-xl p-3 ring-1"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{category.description}</p>
                  <div className="mt-1">
                    <CategoryTypeBadges category={category} />
                  </div>
                  <GroupBadges category={category} />
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit category"
                    onClick={() => handleEdit(category)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete category"
                    onClick={() => setDeleteId(category.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: full table. */}
          <div className="ring-foreground/10 hidden overflow-hidden rounded-xl ring-1 md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div>{category.description}</div>
                      <GroupBadges category={category} />
                    </TableCell>
                    <TableCell>
                      <CategoryTypeBadges category={category} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit category"
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete category"
                          onClick={() => setDeleteId(category.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={editingCategory} />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category</AlertDialogTitle>
            <AlertDialogDescription>
              Transactions using this category must be moved or deleted first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
