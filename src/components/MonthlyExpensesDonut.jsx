import { useMemo, useState } from "react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { useExpenses } from "@/api/hooks";
import { formatCurrency, parseLocalDate } from "@/lib/format";

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

function normalizeCategoryName(record) {
  return record.category_name || record.category?.name || "Uncategorized";
}

export default function MonthlyExpensesDonut() {
  const { data, isLoading, isError, error } = useExpenses();

  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const { items, availableYears } = useMemo(() => {
    const expenseItems = Array.isArray(data) ? data : (data?.items ?? []);
    const yearsSet = new Set();

    for (const expense of expenseItems) {
      if (!expense.date) continue;

      const expenseDate = parseLocalDate(expense.date);

      if (expenseDate) {
        yearsSet.add(expenseDate.getFullYear());
      }
    }

    const years = Array.from(yearsSet).sort((a, b) => a - b);

    return {
      items: expenseItems,
      availableYears: years,
    };
  }, [data]);

  const { chartData, monthLabel, totalAmount } = useMemo(() => {
    let total = 0;
    const byCategory = new Map();

    const addAmount = (category, rawAmount) => {
      const amount = Number(rawAmount ?? 0);

      if (!Number.isFinite(amount) || amount === 0) {
        return;
      }

      total += amount;

      byCategory.set(category, (byCategory.get(category) || 0) + amount);
    };

    for (const expense of items) {
      if (!expense.date) continue;

      const expenseDate = parseLocalDate(expense.date);
      if (!expenseDate) continue;

      const isSelectedMonth =
        expenseDate.getFullYear() === selectedYear &&
        expenseDate.getMonth() === selectedMonth;

      if (!isSelectedMonth) continue;

      /*
       * New expense-items structure:
       * Add each item independently so a split receipt can appear
       * under multiple categories.
       */
      if (Array.isArray(expense.items) && expense.items.length > 0) {
        for (const item of expense.items) {
          addAmount(normalizeCategoryName(item), item.total);
        }

        continue;
      }

      /*
       * Temporary compatibility fallback:
       * Handle an expense returned without expense items.
       */
      addAmount(
        normalizeCategoryName(expense),
        expense.total ?? expense.amount,
      );
    }

    const chartData = Array.from(byCategory.entries())
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);

    const monthLabel = new Date(
      selectedYear,
      selectedMonth,
      1,
    ).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });

    return {
      chartData,
      monthLabel,
      totalAmount: total,
    };
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
    <div className="w-full border rounded-lg bg-white shadow-sm p-4">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-800">
            Monthly Expenses by Category
          </h2>

          <p className="text-xs text-gray-400">Select month and year</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="border rounded px-1 py-0.5 text-xs text-gray-700 bg-white"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(Number(event.target.value))}
          >
            {MONTHS.map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </select>

          <select
            className="border rounded px-1 py-0.5 text-xs text-gray-700 bg-white"
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
          >
            {(availableYears.length ? availableYears : [now.getFullYear()]).map(
              (year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      <div
        className="relative mt-2"
        style={{
          width: "100%",
          height: 260,
          minWidth: 0,
        }}
      >
        {hasData ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value) => `$${Number(value).toFixed(2)}`}
                />

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
                      key={`cell-${entry.name}-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

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
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 text-center px-4">
            No expenses found for this month.
          </div>
        )}
      </div>
    </div>
  );
}
