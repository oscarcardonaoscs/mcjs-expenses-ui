// src/pages/Dashboard.jsx
import MonthlyExpensesDonut from "@/components/MonthlyExpensesDonut";

export default function Dashboard() {
  return (
    <div className="p-4 space-y-4">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-600">Welcome to MCJ Expenses!</p>
      </div>

      {/* Contenido principal */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Donut: gastos del mes por categoría */}
        <MonthlyExpensesDonut />

        {/* Aquí luego podemos agregar otra tarjeta/gráfica */}
        {/* <AnotherWidget /> */}
      </div>
    </div>
  );
}
