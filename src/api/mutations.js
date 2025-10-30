// src/api/mutations.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ---------- Expenses ----------
export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/expenses", payload);
      return data;
    },
    onSuccess: () => {
      // refresca listado y totales si los tienes
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "totals"] });
    },
  });
}

// ---------- Payment Accounts ----------
export function useCreatePaymentAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/payment-accounts", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-accounts"] });
    },
  });
}

export function useUpdatePaymentAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/payment-accounts/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-accounts"] });
    },
  });
}

export function useDeletePaymentAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/payment-accounts/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-accounts"] });
    },
  });
}
