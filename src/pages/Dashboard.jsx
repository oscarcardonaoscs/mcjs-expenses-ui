import { useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import "./Dashboard.css";

import MonthlyExpensesDonut from "@/components/MonthlyExpensesDonut";
import AnnualExpensesByCategoryBar from "@/components/AnnualExpensesByCategoryBar";
import {
  useFinancialSummary,
  useIncomeExpenses,
  useIncomeByServiceType,
} from "@/api/hooks";

// Sample data: replace with API responses in a later phase.

const months = [
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

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

function DemoBadge() {
  return <span className="mcj-demo-badge">Demo</span>;
}

function SectionCard({ title, subtitle, demo = false, children }) {
  return (
    <section className="mcj-section-card">
      <div className="mcj-section-heading">
        <div>
          <h2 className="mcj-section-title">{title}</h2>
          {subtitle && <p className="mcj-section-subtitle">{subtitle}</p>}
        </div>
        {demo && <DemoBadge />}
      </div>
      {children}
    </section>
  );
}

function SummaryCard({ title, value, accent = "default" }) {
  const accentStyles = {
    default: "text-gray-900",
    green: "text-emerald-600",
    red: "text-rose-600",
    blue: "text-blue-600",
  };
  return (
    <div className="mcj-metric-card">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`mcj-metric-value ${accentStyles[accent]}`}>{value}</p>
    </div>
  );
}

function FinancialSummary({ year, month }) {
  const { data, isLoading, isError, error, isFetching } = useFinancialSummary(
    year,
    month,
  );

  if (isLoading) {
    return (
      <SectionCard
        title="Financial Summary"
        subtitle="Overview of business performance"
      >
        <p className="mcj-chart-state">Loading financial summary...</p>
      </SectionCard>
    );
  }

  if (isError) {
    return (
      <SectionCard
        title="Financial Summary"
        subtitle="Overview of business performance"
      >
        <p className="mcj-chart-state" role="alert">
          Unable to load financial summary: {error?.message || "Unknown error"}
        </p>
      </SectionCard>
    );
  }

  const income = Number(data?.income_received ?? 0);
  const expenses = Number(data?.expenses ?? 0);
  const netBalance = Number(data?.net_balance ?? 0);
  const services = Number(data?.services_completed ?? 0);

  const expenseRatio =
    data?.expense_ratio == null ? null : Number(data.expense_ratio);

  return (
    <SectionCard
      title="Financial Summary"
      subtitle="Overview of business performance"
    >
      <div className="mcj-summary-grid">
        <SummaryCard
          title="Income Received"
          value={formatCurrency(income)}
          accent="green"
        />

        <SummaryCard
          title="Expenses"
          value={formatCurrency(expenses)}
          accent="red"
        />

        <SummaryCard
          title="Net Balance"
          value={formatCurrency(netBalance)}
          accent={netBalance >= 0 ? "blue" : "red"}
        />

        <SummaryCard
          title="Services Completed"
          value={services.toLocaleString("en-US")}
        />

        <SummaryCard
          title="Expense Ratio"
          value={expenseRatio === null ? "N/A" : `${expenseRatio.toFixed(2)}%`}
        />
      </div>

      {isFetching && (
        <p className="mcj-summary-refreshing">Updating financial data...</p>
      )}
    </SectionCard>
  );
}

function IncomeExpensesChart({ year }) {
  const { data, isLoading, isError, error, isFetching } =
    useIncomeExpenses(year);

  const chartData = (data?.items ?? []).map((item) => {
    const income = Number(item.income ?? 0);
    const expenses = Number(item.expenses ?? 0);
    const net = income - expenses;

    return {
      month: item.month_label,
      income,
      expenses,
      net,
    };
  });

  return (
    <SectionCard
      title="Income vs Expenses"
      subtitle={`Monthly financial comparison · ${year}`}
    >
      {isLoading ? (
        <p className="mcj-chart-state">Loading income and expenses...</p>
      ) : isError ? (
        <p className="mcj-chart-state" role="alert">
          {error?.message || "Unable to load financial data."}
        </p>
      ) : (
        <>
          <div
            className="mcj-recharts-area"
            style={{
              width: "100%",
              height: 360,
              minWidth: 0,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{
                  top: 12,
                  right: 12,
                  left: 0,
                  bottom: 12,
                }}
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

                {/* Left axis: monthly income and expenses */}
                <YAxis
                  yAxisId="monthly"
                  orientation="left"
                  width={70}
                  domain={[0, "auto"]}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    `$${Number(value).toLocaleString("en-US")}`
                  }
                />

                {/* Right axis: monthly net balance */}
                <YAxis
                  yAxisId="net"
                  orientation="right"
                  width={75}
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 11, fill: "#2563eb" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    `$${Number(value).toLocaleString("en-US")}`
                  }
                />

                <ReferenceLine
                  yAxisId="net"
                  y={0}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                />

                <Tooltip
                  itemSorter={(item) => {
                    const order = {
                      Income: 0,
                      Expenses: 1,
                      "Net Balance": 2,
                    };

                    return order[item.name] ?? 99;
                  }}
                  formatter={(value, name) => [
                    formatCurrency(Number(value)),
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: 10,
                    borderColor: "#e2e8f0",
                  }}
                />

                <Legend
                  wrapperStyle={{
                    fontSize: 12,
                    paddingTop: 10,
                  }}
                />

                <Bar
                  yAxisId="monthly"
                  dataKey="income"
                  name="Income"
                  fill="#10b981"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={26}
                />

                <Bar
                  yAxisId="monthly"
                  dataKey="expenses"
                  name="Expenses"
                  fill="#fb7185"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={26}
                />

                <Line
                  yAxisId="net"
                  type="linear"
                  dataKey="net"
                  name="Net Balance"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{
                    r: 3,
                    fill: "#2563eb",
                    stroke: "#ffffff",
                    strokeWidth: 1,
                  }}
                  activeDot={{
                    r: 5,
                    fill: "#2563eb",
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {isFetching && (
            <p className="mcj-summary-refreshing">Updating financial data...</p>
          )}
        </>
      )}
    </SectionCard>
  );
}

function IncomeByServiceType({ year, month }) {
  const { data, isLoading, isError, error, isFetching } =
    useIncomeByServiceType(year, month);

  const items = data?.items ?? [];

  return (
    <SectionCard
      title="Income by Service Type"
      subtitle={`Collected income by cleaning service`}
    >
      {isLoading ? (
        <p className="mcj-chart-state">Loading income by service type...</p>
      ) : isError ? (
        <p className="mcj-chart-state" role="alert">
          {error?.message || "Unable to load income data."}
        </p>
      ) : items.length === 0 ? (
        <p className="mcj-chart-state">No collected income for this period.</p>
      ) : (
        <>
          <div className="mcj-service-list">
            {items.map((item) => {
              const amount = Number(item.amount ?? 0);
              const percentage = Number(item.percentage ?? 0);

              return (
                <div key={item.service_type}>
                  <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-gray-700">
                      {item.service_type}
                    </span>

                    <span className="text-gray-600">
                      {formatCurrency(amount)}
                    </span>
                  </div>

                  <div className="mcj-service-track">
                    <div
                      className="mcj-service-fill"
                      style={{
                        width: `${Math.max(0, Math.min(percentage, 100))}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-right text-xs text-gray-400">
                    {percentage.toFixed(1)}%
                  </p>
                </div>
              );
            })}
          </div>

          {isFetching && (
            <p className="mcj-summary-refreshing">Updating income data...</p>
          )}
        </>
      )}
    </SectionCard>
  );
}

export default function Dashboard() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const years = Array.from(
    { length: 6 },
    (_, index) => today.getFullYear() - index,
  );

  return (
    <div className="mcj-dashboard">
      {/* Header: filters align right on desktop, wrap below on narrow screens. */}
      <header className="mcj-dashboard-header mcj-page-header">
        <div className="mcj-chart-slot">
          <h1 className="mcj-page-title">Business Overview</h1>
          <p className="mcj-section-subtitle">
            MCJ's Cleaning Service · Financial Dashboard
          </p>
        </div>
        <div className="mcj-dashboard-filters">
          <select
            aria-label="Select month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(Number(event.target.value))}
            className="mcj-period-select"
          >
            {months.map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </select>
          <select
            aria-label="Select year"
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            className="mcj-period-select"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </header>

      <FinancialSummary year={selectedYear} month={selectedMonth + 1} />

      <div className="mcj-chart-grid">
        <div className="mcj-chart-slot">
          <MonthlyExpensesDonut year={selectedYear} month={selectedMonth + 1} />
        </div>
        <div className="mcj-chart-slot">
          <IncomeByServiceType year={selectedYear} month={selectedMonth + 1} />
        </div>
      </div>
      <IncomeExpensesChart year={selectedYear} />
      <div className="mcj-chart-slot">
        <SectionCard
          title="Annual Expenses by Category"
          subtitle={`Monthly expense distribution · ${selectedYear}`}
        >
          <AnnualExpensesByCategoryBar year={selectedYear} />
        </SectionCard>
      </div>
    </div>
  );
}
