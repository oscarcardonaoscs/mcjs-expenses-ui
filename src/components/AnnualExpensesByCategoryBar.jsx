// src/components/AnnualExpensesByCategoryBar.jsx
import { useMemo, useState } from "react";
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

const CURRENT_YEAR = new Date().getFullYear();

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

export default function AnnualExpensesByCategoryBar({
  initialYear = CURRENT_YEAR,
}) {
  const [year, setYear] = useState(initialYear);
  const { data, isLoading, isError, error } = useAnnualExpensesByCategory(year);

  const isMobile = window.innerWidth < 640; // sm breakpoint

  const categories = useMemo(() => {
    if (!data?.items) return [];
    const set = new Set();
    data.items.forEach((m) => {
      Object.keys(m.categories || {}).forEach((c) => set.add(c));
    });
    return Array.from(set).sort();
  }, [data]);

  const chartData = useMemo(() => {
    if (!data?.items) return [];
    return data.items.map((m) => ({
      month: m.month_label,
      ...m.categories,
    }));
  }, [data]);

  if (isLoading) return <div>Loading annual expenses...</div>;
  if (isError) return <div className="text-red-600">{error?.message}</div>;
  if (!chartData.length) return <div>No data found.</div>;

  const yearOptions = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

  return (
    <div className="border rounded-lg shadow-sm bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h5 className="font-semibold text-gray-800 mb-0">
          Annual Expenses by Category
        </h5>

        <select
          className="text-sm border rounded px-2 py-1"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div
        className="p-4"
        style={{
          height: isMobile ? 420 : 360, // más alto en mobile
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 8,
              right: isMobile ? 10 : 24,
              left: isMobile ? 4 : 20,
              bottom: 8,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="month" tick={{ fontSize: isMobile ? 10 : 12 }} />

            <YAxis
              width={isMobile ? 40 : 80}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              tickFormatter={(v) => formatCurrency(v)}
            />

            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Legend
              wrapperStyle={{
                fontSize: isMobile ? 10 : 12,
                paddingTop: 8,
              }}
            />

            {categories.map((cat, index) => {
              const color =
                CATEGORY_COLORS[cat] ||
                FALLBACK_COLORS[index % FALLBACK_COLORS.length];
              return <Bar key={cat} dataKey={cat} stackId="a" fill={color} />;
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
