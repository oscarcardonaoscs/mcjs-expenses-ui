import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ExpensesTable } from "@/components/ExpensesTable";

export default function ExpensesList() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data } = await api.get("/expenses");
      // Adaptar estructura a lo que espera la tabla
      return (data.items ?? []).map((e) => ({
        ...e,
        category: e.category_name ? { name: e.category_name } : null,
        vendor: e.vendor_name ? { name: e.vendor_name } : null,
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="alert alert-danger" role="alert">
        Error al cargar los gastos: {error?.message ?? "Intenta de nuevo"}
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Gastos registrados</h2>
      {data.length === 0 ? (
        <p className="text-muted">No hay gastos registrados aún.</p>
      ) : (
        <ExpensesTable items={data} />
      )}
    </div>
  );
}
