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
