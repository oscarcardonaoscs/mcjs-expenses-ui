// src/components/MonthlyExpensesDonut.jsx
import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useExpenses } from "@/api/hooks";
import { formatCurrency } from "@/lib/format";

const COLORS = [
  "#3b82f6", // azul
  "#22c55e", // verde
  "#f97316", // naranja
  "#a855f7", // morado
  "#ef4444", // rojo
  "#14b8a6", // teal
  "#eab308", // amarillo
  "#6366f1", // indigo
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function normalizeCategoryName(expense) {
  return expense.category_name || expense.category?.name || "Uncategorized";
}

export default function MonthlyExpensesDonut() {
  const { data, isLoading, isError, error } = useExpenses();

  // 🔹 estado de mes/año seleccionados
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0–11
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Lista de años disponibles según los gastos
  const { items, availableYears } = useMemo(() => {
    const items = Array.isArray(data) ? data : data?.items ?? [];
    const yearsSet = new Set();

    for (const exp of items) {
      if (!exp.date) continue;
      const d = new Date(exp.date);
      if (!isNaN(d)) {
        yearsSet.add(d.getFullYear());
      }
    }

    const years = Array.from(yearsSet).sort((a, b) => a - b);
    return { items, availableYears: years };
  }, [data]);

  const { chartData, monthLabel, totalAmount } = useMemo(() => {
    let total = 0;
    const byCategory = new Map();

    for (const exp of items) {
      if (!exp.date) continue;
      const d = new Date(exp.date);
      if (isNaN(d)) continue;

      if (d.getFullYear() !== selectedYear || d.getMonth() !== selectedMonth) {
        continue;
      }

      const cat = normalizeCategoryName(exp);
      const amount = Number(exp.total ?? exp.amount ?? 0);
      if (!amount) continue;

      total += amount;
      byCategory.set(cat, (byCategory.get(cat) || 0) + amount);
    }

    const chartData = Array.from(byCategory.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    const monthLabel = new Date(
      selectedYear,
      selectedMonth,
      1
    ).toLocaleDateString(undefined, { month: "long", year: "numeric" });

    return { chartData, monthLabel, totalAmount: total };
  }, [items, selectedMonth, selectedYear]);

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center border rounded-lg bg-white shadow-sm">
        <span className="text-sm text-gray-500">Loading monthly expenses…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-64 flex items-center justify-center border rounded-lg bg-white shadow-sm">
        <span className="text-sm text-red-500">
          Error loading expenses: {error?.message || "Unknown error"}
        </span>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center border rounded-lg bg-white shadow-sm px-4 text-center">
        <p className="text-sm text-gray-500">No expenses found yet.</p>
      </div>
    );
  }

  const hasData = chartData.length > 0;

  return (
    <div className="w-full h-80 border rounded-lg bg-white shadow-sm p-4 flex flex-col">
      {/* Header con título + selects de mes/año */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-800">
            Monthly Expenses by Category
          </h2>
          <p className="text-xs text-gray-400">Select month and year</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mes */}
          <select
            className="border rounded px-1 py-0.5 text-xs text-gray-700 bg-white"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, idx) => (
              <option key={m} value={idx}>
                {m}
              </option>
            ))}
          </select>

          {/* Año */}
          <select
            className="border rounded px-1 py-0.5 text-xs text-gray-700 bg-white"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {/* Si no hay years detectados, mostramos al menos el año actual */}
            {(availableYears.length ? availableYears : [now.getFullYear()]).map(
              (y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* Gráfica */}
      <div className="flex-1 relative flex items-center justify-center">
        {hasData ? (
          <>
            <PieChart width={320} height={260}>
              <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: "0.75rem" }}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                stroke="#ffffff"
                strokeWidth={1}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>

            {/* Total en el centro */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-gray-400 uppercase tracking-wide font-bold">
                Total
              </span>
              <span className="text-lg font-semibold text-gray-800">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </>
        ) : (
          <div className="text-xs text-gray-400 text-center px-4">
            No expenses found for this month.
          </div>
        )}
      </div>
    </div>
  );
}
