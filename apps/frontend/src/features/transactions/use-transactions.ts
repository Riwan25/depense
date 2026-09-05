import {
  MonthlySummary$,
  TransactionSummary$,
  TransactionWithCategory$,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from "@repo/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";

const TRANSACTIONS_QUERY_KEY = "transactions";
const TRANSACTIONS_SUMMARY_QUERY_KEY = "transactions-summary";

export interface TransactionListFilter {
  categoryId?: string;
  isChequeRepas?: boolean;
  page: number;
  pageSize: number;
}

export function useTransactions(filter: TransactionListFilter) {
  return useQuery({
    queryKey: [TRANSACTIONS_QUERY_KEY, filter],
    queryFn: async () => {
      const res = await apiClient.api.transactions.$get({
        query: {
          ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
          ...(filter.isChequeRepas !== undefined
            ? { isChequeRepas: String(filter.isChequeRepas) }
            : {}),
          page: String(filter.page),
          pageSize: String(filter.pageSize),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      return {
        transactions: data.transactions.map((transaction) =>
          TransactionWithCategory$.parse(transaction),
        ),
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
      };
    },
    placeholderData: (prev) => prev,
    staleTime: 10_000,
  });
}

export function useTransactionSummary() {
  return useQuery({
    queryKey: [TRANSACTIONS_SUMMARY_QUERY_KEY],
    queryFn: async () => {
      const res = await apiClient.api.transactions.summary.$get();
      if (!res.ok) throw new Error("Failed to fetch summary");
      return TransactionSummary$.parse(await res.json());
    },
    staleTime: 10_000,
  });
}

export function useTransactionMonthlySummary() {
  return useQuery({
    queryKey: ["transactions-monthly-summary"],
    queryFn: async () => {
      const res = await apiClient.api.transactions.summary.monthly.$get();
      if (!res.ok) throw new Error("Failed to fetch monthly summary");
      const data = await res.json();
      return data.map((entry) => MonthlySummary$.parse(entry));
    },
    staleTime: 30_000,
  });
}

function useInvalidateTransactions() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_SUMMARY_QUERY_KEY] });
  };
}

export function useCreateTransaction() {
  const invalidate = useInvalidateTransactions();

  return useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      const res = await apiClient.api.transactions.$post({ json: data });
      if (!res.ok) throw new Error("Failed to create transaction");
      return TransactionWithCategory$.parse(await res.json());
    },
    onSuccess: () => {
      invalidate();
      toast.success("Transaction added");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateTransactions();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTransactionInput }) => {
      const res = await apiClient.api.transactions[":id"].$patch({ param: { id }, json: data });
      if (!res.ok) throw new Error("Failed to update transaction");
      return TransactionWithCategory$.parse(await res.json());
    },
    onSuccess: () => {
      invalidate();
      toast.success("Transaction updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateTransactions();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.api.transactions[":id"].$delete({ param: { id } });
      if (!res.ok) throw new Error("Failed to delete transaction");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Transaction deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
