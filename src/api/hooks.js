// src/api/hooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ---------- Categories ----------
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/categories");
      return (data?.items ?? []).sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ---------- Expense Concepts ----------
export function useExpenseConcepts(categoryId, enabled = true) {
  const normalizedCategoryId = categoryId ? Number(categoryId) : null;

  return useQuery({
    queryKey: ["expense-concepts", normalizedCategoryId],
    queryFn: async () => {
      const { data } = await api.get("/expense-concepts/", {
        params: {
          category_id: normalizedCategoryId,
          is_active: true,
        },
      });

      return (data?.items ?? []).sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: enabled && !!normalizedCategoryId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateExpenseConcept() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/expense-concepts/", payload);
      return data;
    },
    onSuccess: (createdConcept) => {
      const categoryId = Number(createdConcept.category_id);
      const queryKey = ["expense-concepts", categoryId];

      // Add the new concept to the current cache immediately so the
      // <select> already contains the option before ExpenseForm selects it.
      qc.setQueryData(queryKey, (current = []) => {
        const items = Array.isArray(current) ? current : [];

        return [
          ...items.filter(
            (concept) => Number(concept.id) !== Number(createdConcept.id),
          ),
          createdConcept,
        ].sort((a, b) => a.name.localeCompare(b.name));
      });

      // Revalidate with the API in the background.
      qc.invalidateQueries({
        queryKey,
      });
    },
  });
}

// ---------- Vendors ----------
export function useVendors() {
  return useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data } = await api.get("/vendors");
      return (data?.items ?? []).sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ---------- Expenses ----------
export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data } = await api.get("/expenses");
      return data?.items ?? [];
    },
    staleTime: 60 * 1000,
  });
}

// ---------- Payment Accounts ----------
export function usePaymentAccounts() {
  return useQuery({
    queryKey: ["payment-accounts"],
    queryFn: async () => {
      const { data } = await api.get("/payment-accounts");
      return (data?.items ?? []).sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ---------- Mutations: Payment Accounts ----------
export function useCreatePaymentAccount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/payment-accounts", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-accounts"] }),
  });
}

export function useUpdatePaymentAccount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/payment-accounts/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-accounts"] }),
  });
}

export function useDeletePaymentAccount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/payment-accounts/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-accounts"] }),
  });
}

export function useAnnualExpensesByCategory(year) {
  return useQuery({
    queryKey: ["annual-expenses-by-category", year],
    queryFn: async () => {
      const { data } = await api.get("/reports/annual-expenses-by-category", {
        params: { year },
      });

      return data; // { year, items: [...] }
    },
    enabled: !!year,
  });
}

// ---------- Financial Dashboard ----------
export function useFinancialSummary(year, month) {
  return useQuery({
    queryKey: ["financial-summary", year, month],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/financial-summary", {
        params: { year, month },
      });

      return data;
    },
    enabled:
      Number.isInteger(year) &&
      Number.isInteger(month) &&
      month >= 1 &&
      month <= 12,
    staleTime: 60 * 1000,
  });
}

// ---------- Income vs Expenses ----------
export function useIncomeExpenses(year) {
  return useQuery({
    queryKey: ["income-expenses", year],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/income-expenses", {
        params: { year },
      });

      return data;
    },
    enabled: Number.isInteger(year) && year >= 2000,
    staleTime: 60 * 1000,
  });
}

// ---------- Income by Service Type ----------
export function useIncomeByServiceType(year, month) {
  return useQuery({
    queryKey: ["income-by-service-type", year, month],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/income-by-service-type", {
        params: { year, month },
      });

      return data;
    },
    enabled:
      Number.isInteger(year) &&
      Number.isInteger(month) &&
      month >= 1 &&
      month <= 12,
    staleTime: 60 * 1000,
  });
}
