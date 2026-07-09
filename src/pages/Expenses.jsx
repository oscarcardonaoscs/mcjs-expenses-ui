// D:\Repositorio\mcjs-expenses-ui\src\pages\Expenses.jsx

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import ExpenseForm from "@/components/ExpenseForm";
import { ExpensesTable } from "@/components/ExpensesTable";

export default function Expenses() {
  const qc = useQueryClient();
  const today = new Date();

  // 🔹 Filtros: categoría, mes, año
  const [filters, setFilters] = useState(() => ({
    categoryId: "all", // "all" = todas las categorías
    month: today.getMonth() + 1, // 1-12, mes actual
    year: today.getFullYear(), // año actual
  }));

  // 🔹 Años dinámicos: desde 2025 hasta el año actual (descendente)
  const years = useMemo(() => {
    const minYear = 2025;
    const current = new Date().getFullYear();
    const arr = [];
    for (let y = current; y >= minYear; y--) {
      arr.push(y);
    }
    return arr;
  }, []);

  // 🔹 Lista de meses (para mostrar texto bonito)
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  // 🔹 Cargar categorías para el filtro
  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/categories");
      // Asumiendo que el backend regresa { items: [...] }
      return data.items ?? data ?? [];
    },
  });

  // 🔹 Obtener gastos existentes con filtros
  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["expenses", filters],
    queryFn: async () => {
      const params = {
        month: filters.month,
        year: filters.year,
      };

      if (filters.categoryId !== "all") {
        params.category_id = filters.categoryId;
      }

      const { data } = await api.get("/expenses", { params });

      return (data.items ?? []).map((e) => ({
        ...e,
        category: e.category_name ? { name: e.category_name } : null,
        vendor: e.vendor_name ? { name: e.vendor_name } : null,
      }));
    },
  });

  // Mutation para crear, editar gasto
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (payload) => {
      try {
        if (payload.id) {
          const { id, ...body } = payload;
          console.log("[PUT /expenses] body:", body);

          const { data } = await api.put(`/expenses/${id}`, body);
          return data;
        }

        console.log("[POST /expenses] payload:", payload);

        const { data } = await api.post("/expenses", payload);
        return data;
      } catch (err) {
        console.error(
          "[Expenses mutation error detail]",
          JSON.stringify(err?.response?.data?.detail, null, 2),
        );

        console.error(
          "[Expenses mutation error full]",
          err?.response?.data ?? err,
        );

        throw err;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  // Mutation para Eliminar gasto
  const { mutateAsync: deleteExpenseAsync, isPending: isDeleting } =
    useMutation({
      mutationFn: async (expenseId) => {
        const { data } = await api.delete(`/expenses/${expenseId}`);
        return data;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["expenses"] });
      },
    });

  // 🔹 Handlers
  const [mode, setMode] = useState("list"); // 'list' | 'create' | 'edit'
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  const startCreate = () => {
    setExpenseToEdit(null);
    setMode("create");
  };

  const startEdit = (expense) => {
    setExpenseToEdit(expense);
    setMode("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelForm = () => {
    setExpenseToEdit(null);
    setMode("list");
  };

  const handleSubmit = async (payload) => {
    await mutateAsync(payload);
    setExpenseToEdit(null);
    setMode("list");
  };

  const handleDelete = async (expense) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?",
    );

    if (!confirmed) return;

    await deleteExpenseAsync(expense.id);
  };

  const handleCategoryChange = (e) =>
    setFilters((prev) => ({ ...prev, categoryId: e.target.value }));

  const handleMonthChange = (e) =>
    setFilters((prev) => ({ ...prev, month: Number(e.target.value) }));

  const handleYearChange = (e) =>
    setFilters((prev) => ({ ...prev, year: Number(e.target.value) }));

  return (
    <div className="px-0 mt-3">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-4">
        <h1 className="h3 m-0">Expenses</h1>

        {mode === "list" && (
          <button className="btn btn-success" onClick={startCreate}>
            Add
          </button>
        )}
      </div>

      {/* Contenido */}
      <div className="px-0">
        {mode === "create" || mode === "edit" ? (
          <ExpenseForm
            onSubmit={handleSubmit}
            isSubmitting={isPending}
            expenseToEdit={expenseToEdit}
            onCancelEdit={cancelForm}
            onCancel={cancelForm}
          />
        ) : (
          <>
            {/* 🔹 Filtros (solo en modo lista) */}
            <div className="border rounded-3 p-3 mb-3 bg-light">
              <div className="row g-3 align-items-end">
                {/* Category */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-bold">Category</label>
                  <select
                    className="form-select"
                    value={filters.categoryId}
                    onChange={handleCategoryChange}
                    disabled={isLoadingCategories || isErrorCategories}
                  >
                    <option value="all">All categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month */}
                <div className="col-6 col-md-4">
                  <label className="form-label fw-bold">Month</label>
                  <select
                    className="form-select"
                    value={filters.month}
                    onChange={handleMonthChange}
                  >
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div className="col-6 col-md-4">
                  <label className="form-label fw-bold">Year</label>
                  <select
                    className="form-select"
                    value={filters.year}
                    onChange={handleYearChange}
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Tabla */}
            {isLoading ? (
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
                <ExpensesTable
                  items={data}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
