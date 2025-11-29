import MonthlyExpensesDonut from "@/components/MonthlyExpensesDonut";
import AnnualExpensesByCategoryBar from "@/components/AnnualExpensesByCategoryBar";

export default function Dashboard() {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-600">Welcome to MCJ Expenses!</p>
      </div>

      {/* Main content */}
      <div className="grid md:grid-cols-2 gap-4">
        <MonthlyExpensesDonut />

        <div className="my-6">
          <AnnualExpensesByCategoryBar />
        </div>
      </div>
    </div>
  );
}
