// src/components/AnnualExpensesByCategoryBar.jsx
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAnnualExpensesByCategory } from "@/api/hooks";
import { formatCurrency } from "@/lib/format";

const CATEGORY_COLORS = {
  "Car/Gasoline": "#2563eb",
  "General Expenses": "#16a34a",
  Helpers: "#f59e0b",
  Supplies: "#dc2626",
};
const FALLBACK_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0d9488",
];

// This component renders ONLY its chart. The Dashboard owns the card and year filter.
export default function AnnualExpensesByCategoryBar({
  year = new Date().getFullYear(),
}) {
  const { data, isLoading, isError, error } = useAnnualExpensesByCategory(year);

  const categories = useMemo(() => {
    if (!data?.items) return [];
    const names = new Set();
    data.items.forEach((item) =>
      Object.keys(item.categories || {}).forEach((name) => names.add(name)),
    );
    return Array.from(names).sort();
  }, [data]);

  const chartData = useMemo(() => {
    if (!data?.items) return [];
    return data.items.map((item) => ({
      month: item.month_label,
      ...item.categories,
    }));
  }, [data]);

  if (isLoading)
    return <p className="mcj-chart-state">Loading annual expenses...</p>;
  if (isError)
    return (
      <p className="mcj-chart-state" role="alert">
        {error?.message || "Unable to load annual expenses."}
      </p>
    );
  if (!chartData.length)
    return <p className="mcj-chart-state">No data found for {year}.</p>;

  return (
    <div
      className="mcj-recharts-area"
      style={{ width: "100%", height: 320, minWidth: 0 }}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
        >
          <CartesianGrid
            stroke="#e5e7eb"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            width={70}
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              `$${Number(value).toLocaleString("en-US")}`
            }
          />
          <Tooltip
            formatter={(value) => formatCurrency(value)}
            contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0" }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
          {categories.map((category, index) => (
            <Bar
              key={category}
              name={category}
              dataKey={category}
              stackId="expenses"
              fill={
                CATEGORY_COLORS[category] ||
                FALLBACK_COLORS[index % FALLBACK_COLORS.length]
              }
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
