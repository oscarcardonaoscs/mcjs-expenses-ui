import { useMemo } from "react";
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
  "#3b82f6",
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#ef4444",
  "#14b8a6",
  "#eab308",
  "#6366f1",
];

function normalizeCategoryName(record) {
  return record.category_name || record.category?.name || "Uncategorized";
}

export default function MonthlyExpensesDonut({ year, month }) {
  const { data, isLoading, isError, error } = useExpenses();

  const { chartData, totalAmount } = useMemo(() => {
    const expenses = Array.isArray(data) ? data : (data?.items ?? []);
    const byCategory = new Map();
    let total = 0;

    const addAmount = (category, rawAmount) => {
      const amount = Number(rawAmount ?? 0);
      if (!Number.isFinite(amount) || amount === 0) return;
      total += amount;
      byCategory.set(category, (byCategory.get(category) || 0) + amount);
    };

    for (const expense of expenses) {
      if (!expense.date) continue;
      const expenseDate = parseLocalDate(expense.date);
      if (!expenseDate) continue;

      if (
        expenseDate.getFullYear() !== year ||
        expenseDate.getMonth() + 1 !== month
      ) {
        continue;
      }

      // Tickets divided into expense_items: use each item once.
      if (Array.isArray(expense.items) && expense.items.length > 0) {
        for (const item of expense.items) {
          addAmount(normalizeCategoryName(item), item.total);
        }
      } else {
        // Compatibility with older expenses without items.
        addAmount(
          normalizeCategoryName(expense),
          expense.total ?? expense.amount,
        );
      }
    }

    return {
      chartData: Array.from(byCategory, ([name, value]) => ({
        name,
        value,
      })).sort((a, b) => b.value - a.value),
      totalAmount: total,
    };
  }, [data, year, month]);

  const periodLabel = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <section className="mcj-section-card" style={{ minWidth: 0 }}>
      <div className="mcj-section-heading">
        <div>
          <h2 className="mcj-section-title">Monthly Expenses by Category</h2>
          <p className="mcj-section-subtitle">{periodLabel}</p>
        </div>
      </div>

      {isLoading ? (
        <p className="mcj-chart-state">Loading monthly expenses...</p>
      ) : isError ? (
        <p className="mcj-chart-state" role="alert">
          Error loading expenses: {error?.message || "Unknown error"}
        </p>
      ) : chartData.length === 0 ? (
        <p className="mcj-chart-state">No expenses found for this month.</p>
      ) : (
        <>
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 290,
              minWidth: 0,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={2}
                  stroke="#ffffff"
                  strokeWidth={1}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ textAlign: "center", marginTop: 4 }}>
            <span style={{ fontSize: 12, color: "#64748b", marginRight: 8 }}>
              Total Expenses
            </span>
            <strong style={{ fontSize: 16, color: "#17202f" }}>
              {formatCurrency(totalAmount)}
            </strong>
          </div>
        </>
      )}
    </section>
  );
}
