import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import ExpenseForm from "@/components/ExpenseForm";
import { ExpensesTable } from "@/components/ExpensesTable";

export default function Expenses() {
  const qc = useQueryClient();
  const [mode, setMode] = useState("list"); // 'list' | 'create'

  // 🔹 Obtener gastos existentes
  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data } = await api.get("/expenses");
      return (data.items ?? []).map((e) => ({
        ...e,
        category: e.category_name ? { name: e.category_name } : null,
        vendor: e.vendor_name ? { name: e.vendor_name } : null,
      }));
    },
  });

  // 🔹 Mutation para crear gasto
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/expenses", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] }); // refresca la tabla
    },
  });

  // 🔹 Handlers
  const startCreate = () => setMode("create");
  const cancelCreate = () => setMode("list");

  const handleSubmit = async (payload) => {
    await mutateAsync(payload);
    setMode("list");
  };

  return (
    <div className="px-0 mt-3">
      {/* Header con paddings suaves */}
      <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-4">
        <h1 className="h3 m-0">Expenses</h1>

        {mode === "list" && (
          <button className="btn btn-success" onClick={startCreate}>
            New Expense
          </button>
        )}
      </div>

      {/* Contenido real - full width sin padding */}
      <div className="px-0">
        {mode === "create" ? (
          <ExpenseForm
            onSubmit={handleSubmit}
            isSubmitting={isPending}
            onCancel={cancelCreate}
          />
        ) : isLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : isError ? (
          <div className="alert alert-danger m-3" role="alert">
            Error al cargar gastos: {error?.message ?? "Intenta de nuevo"}
          </div>
        ) : data.length === 0 ? (
          <p className="text-muted px-3">No hay gastos registrados aún.</p>
        ) : (
          <div className="px-0">
            <ExpensesTable items={data} />
          </div>
        )}
      </div>
    </div>
  );
}
