import { useState, useMemo } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import ExpenseForm from "@/components/ExpenseForm";

import { ExpensesTable } from "@/components/ExpensesTable";
import "../styles/mcj-ui.css";

// ==========================================

// MONTHS

// ==========================================

const MONTHS = [
  { value: "all", label: "All months" },

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

// ==========================================

// INITIAL FILTERS

// ==========================================

function initialFilters() {
  const today = new Date();

  return {
    year: today.getFullYear(),

    month: today.getMonth() + 1,

    categoryId: "all",

    vendor: "all",

    payment: "all",

    type: "all",
  };
}

// ==========================================

// HELPERS

// ==========================================

function getExpenseItems(expense) {
  return Array.isArray(expense.items) && expense.items.length > 0
    ? expense.items
    : [expense];
}

function getVendor(expense) {
  return expense.vendor_name || expense.vendor?.name || "";
}

function getItemType(item) {
  return item.expense_type || "";
}

function getPayment(expense) {
  const method = expense.payment_method || "";

  const last4 = expense.payment_account_last4 || "";

  if (!method) return "";

  return last4 ? `${method} **${last4}` : method;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

// ==========================================

// MAIN COMPONENT

// ==========================================

export default function Expenses() {
  const qc = useQueryClient();

  // Filtros automáticos

  const [filters, setFilters] = useState(initialFilters);

  // Búsqueda específica

  const [searchText, setSearchText] = useState("");

  const [appliedSearch, setAppliedSearch] = useState("");

  // Modos

  const [mode, setMode] = useState("list");

  const [expenseToEdit, setExpenseToEdit] = useState(null);

  // ==========================================

  // YEARS

  // ==========================================

  const years = useMemo(() => {
    const current = new Date().getFullYear();

    const result = [];

    for (let year = current; year >= 2025; year--) {
      result.push(year);
    }

    return result;
  }, []);

  // ==========================================

  // CATEGORIES

  // ==========================================

  const {
    data: categories = [],

    isLoading: isLoadingCategories,

    isError: isErrorCategories,
  } = useQuery({
    queryKey: ["categories"],

    queryFn: async () => {
      const { data } = await api.get("/categories");

      const result = data.items ?? data ?? [];

      return Array.isArray(result) ? result : [];
    },
  });

  // ==========================================

  // EXPENSES

  // ==========================================

  const {
    data = [],

    isLoading,

    isError,

    error,
  } = useQuery({
    queryKey: ["expenses", filters.year, filters.month, filters.categoryId],

    queryFn: async () => {
      // Year siempre se envía.

      const params = {
        year: filters.year,
      };

      // Month se envía solamente cuando

      // seleccionamos un mes específico.

      if (filters.month !== "all") {
        params.month = filters.month;
      }

      // Category

      if (filters.categoryId !== "all") {
        params.category_id = filters.categoryId;
      }

      const { data } = await api.get("/expenses", {
        params,
      });

      return (data.items ?? []).map((expense) => ({
        ...expense,

        category: expense.category_name
          ? { name: expense.category_name }
          : null,

        vendor: expense.vendor_name ? { name: expense.vendor_name } : null,
      }));
    },
  });

  // ==========================================

  // AVAILABLE FILTER OPTIONS

  // ==========================================

  const vendors = useMemo(() => uniqueSorted(data.map(getVendor)), [data]);

  const payments = useMemo(() => uniqueSorted(data.map(getPayment)), [data]);

  const types = useMemo(
    () =>
      uniqueSorted(
        data.flatMap((expense) => getExpenseItems(expense).map(getItemType)),
      ),

    [data],
  );

  // ==========================================

  // LOCAL FILTERS

  // ==========================================

  const filteredExpenses = useMemo(() => {
    const term = appliedSearch.trim().toLowerCase();

    return data.filter((expense) => {
      // Vendor

      if (filters.vendor !== "all" && getVendor(expense) !== filters.vendor) {
        return false;
      }

      // Payment

      if (
        filters.payment !== "all" &&
        getPayment(expense) !== filters.payment
      ) {
        return false;
      }

      const items = getExpenseItems(expense);

      // Type

      if (
        filters.type !== "all" &&
        !items.some((item) => getItemType(item) === filters.type)
      ) {
        return false;
      }

      // Search by Item - Expense Concepts

      if (term) {
        const matchesItem = items.some((item) => {
          const conceptName =
            item.expense_concept_name || item.expense_concept?.name || "";

          return conceptName.toLowerCase().includes(term);
        });

        if (!matchesItem) return false;
      }

      return true;
    });
  }, [data, filters, appliedSearch]);

  // ==========================================

  // CREATE / UPDATE

  // ==========================================

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
      qc.invalidateQueries({
        queryKey: ["expenses"],
      });
    },
  });

  // ==========================================

  // DELETE

  // ==========================================

  const { mutateAsync: deleteExpenseAsync, isPending: isDeleting } =
    useMutation({
      mutationFn: async (expenseId) => {
        const { data } = await api.delete(`/expenses/${expenseId}`);

        return data;
      },

      onSuccess: () => {
        qc.invalidateQueries({
          queryKey: ["expenses"],
        });
      },
    });

  // ==========================================

  // HANDLERS

  // ==========================================

  const startCreate = () => {
    setExpenseToEdit(null);

    setMode("create");
  };

  const startEdit = (expense) => {
    setExpenseToEdit(expense);

    setMode("edit");

    window.scrollTo({
      top: 0,

      behavior: "smooth",
    });
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

  // Filtros automáticos

  const updateFilter = (field, value) => {
    setFilters((prev) => ({
      ...prev,

      [field]: value,
    }));
  };

  // Clear Filters

  const clearFilters = () => {
    setFilters(initialFilters());

    setSearchText("");

    setAppliedSearch("");
  };

  // Search by Item

  const searchItems = (event) => {
    event?.preventDefault();

    setAppliedSearch(searchText.trim());
  };

  const clearItemSearch = () => {
    setSearchText("");

    setAppliedSearch("");
  };

  // ==========================================

  // RESULTS SUMMARY

  // ==========================================

  const hasActiveFilters =
    filters.categoryId !== "all" ||
    filters.vendor !== "all" ||
    filters.payment !== "all" ||
    filters.type !== "all";

  const currentMonthLabel =
    filters.month === "all"
      ? "All months"
      : (MONTHS.find((month) => month.value === filters.month)?.label ?? "");

  const periodLabel =
    filters.month === "all"
      ? `All of ${filters.year}`
      : `${currentMonthLabel} ${filters.year}`;

  // ==========================================

  // RENDER

  // ==========================================

  return (
    <div className="px-2 px-md-0 mcj-expenses-page">
      {/* HEADER */}

      <header className="mcj-page-header">
        <div>
          <h1 className="mcj-page-title">Expenses</h1>
        </div>

        {mode === "list" && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={startCreate}
          >
            <span className="me-1" aria-hidden="true">
              +
            </span>
            Add Expense
          </button>
        )}
      </header>

      {/* FORM OR LIST */}

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
          {/* ================= FILTERS ================= */}

          <section className="mcj-ui-filter-panel mcj-exp-filter-panel border rounded-3 bg-light p-3 mb-3">
            <div className="d-flex align-items-center gap-2 mb-2">
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 7h16M7 12h10M10 17h4" />
                <circle cx="8" cy="7" r="2" fill="#f8fafc" />
                <circle cx="15" cy="12" r="2" fill="#f8fafc" />
              </svg>

              <h2 className="h6 fw-bold m-0">Filters</h2>
            </div>

            <div className="row g-2">
              {/* YEAR */}

              <div className="col-12 col-sm-6 col-lg-4">
                <label
                  htmlFor="expense-year"
                  className="form-label fw-semibold"
                >
                  Year
                </label>

                <select
                  id="expense-year"
                  className="form-select"
                  value={filters.year}
                  onChange={(e) => updateFilter("year", Number(e.target.value))}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* MONTH */}

              <div className="col-12 col-sm-6 col-lg-4">
                <label
                  htmlFor="expense-month"
                  className="form-label fw-semibold"
                >
                  Month
                </label>

                <select
                  id="expense-month"
                  className="form-select"
                  value={filters.month}
                  onChange={(e) => {
                    const value = e.target.value;

                    updateFilter(
                      "month",

                      value === "all" ? "all" : Number(value),
                    );
                  }}
                >
                  {MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* CATEGORY */}

              <div className="col-12 col-sm-6 col-lg-4">
                <label
                  htmlFor="expense-category"
                  className="form-label fw-semibold"
                >
                  Category
                </label>

                <select
                  id="expense-category"
                  className="form-select"
                  value={filters.categoryId}
                  disabled={isLoadingCategories || isErrorCategories}
                  onChange={(e) => updateFilter("categoryId", e.target.value)}
                >
                  <option value="all">All categories</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* VENDOR */}

              <div className="col-12 col-sm-6 col-lg-4">
                <label
                  htmlFor="expense-vendor"
                  className="form-label fw-semibold"
                >
                  Vendor
                </label>

                <select
                  id="expense-vendor"
                  className="form-select"
                  value={filters.vendor}
                  onChange={(e) => updateFilter("vendor", e.target.value)}
                >
                  <option value="all">All vendors</option>

                  {vendors.map((vendor) => (
                    <option key={vendor} value={vendor}>
                      {vendor}
                    </option>
                  ))}

                  {filters.vendor !== "all" &&
                    !vendors.includes(filters.vendor) && (
                      <option value={filters.vendor}>{filters.vendor}</option>
                    )}
                </select>
              </div>

              {/* PAYMENT */}

              <div className="col-12 col-sm-6 col-lg-4">
                <label
                  htmlFor="expense-payment"
                  className="form-label fw-semibold"
                >
                  Payment
                </label>

                <select
                  id="expense-payment"
                  className="form-select"
                  value={filters.payment}
                  onChange={(e) => updateFilter("payment", e.target.value)}
                >
                  <option value="all">All payments</option>

                  {payments.map((payment) => (
                    <option key={payment} value={payment}>
                      {payment}
                    </option>
                  ))}

                  {filters.payment !== "all" &&
                    !payments.includes(filters.payment) && (
                      <option value={filters.payment}>{filters.payment}</option>
                    )}
                </select>
              </div>

              {/* TYPE */}

              <div className="col-12 col-sm-6 col-lg-4">
                <label
                  htmlFor="expense-type"
                  className="form-label fw-semibold"
                >
                  Type
                </label>

                <select
                  id="expense-type"
                  className="form-select"
                  value={filters.type}
                  onChange={(e) => updateFilter("type", e.target.value)}
                >
                  <option value="all">All types</option>

                  {types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}

                  {filters.type !== "all" && !types.includes(filters.type) && (
                    <option value={filters.type}>{filters.type}</option>
                  )}
                </select>
              </div>
            </div>
            <div className="d-flex justify-content-end mt-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary mcj-exp-clear-filters"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </section>

          {/* ================= SEARCH BY ITEM ================= */}

          <section className="mcj-ui-filter-panel mcj-exp-search-panel border rounded-3 bg-light p-3 mb-3">
            <div className="d-flex align-items-center gap-2 mb-2">
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 5 5" />
              </svg>
              <h2 className="h6 fw-bold m-0">Search by Item</h2>
            </div>
            <form onSubmit={searchItems}>
              <div className="d-flex flex-column flex-sm-row gap-2">
                <input
                  type="search"
                  className="form-control flex-grow-1 mcj-exp-search-input"
                  placeholder="Search an item, e.g. duster, gloves..."
                  aria-label="Search by item description"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-success mcj-exp-search-button"
                >
                  Search Item
                </button>
                {appliedSearch && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={clearItemSearch}
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* ================= RESULTS SUMMARY ================= */}

          {!isLoading && !isError && (
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              {appliedSearch ? (
                <>
                  <span className="text-muted">Results for:</span>

                  <span className="fw-semibold">{appliedSearch}</span>

                  <span className="text-muted small">({periodLabel})</span>
                </>
              ) : (
                <span className="text-muted">Expenses for {periodLabel}</span>
              )}

              <span className="badge bg-light text-dark border rounded-pill px-3 py-2">
                {filteredExpenses.length}{" "}
                {filteredExpenses.length === 1 ? "result" : "results"}
              </span>

              {hasActiveFilters && (
                <span className="badge bg-light text-secondary border rounded-pill px-3 py-2">
                  Filters applied
                </span>
              )}
            </div>
          )}

          {/* ================= EXPENSES TABLE ================= */}

          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading expenses...</span>
              </div>
            </div>
          ) : isError ? (
            <div className="alert alert-danger" role="alert">
              Error loading expenses: {error?.message ?? "Please try again"}
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="border rounded-3 p-4 text-center bg-white">
              <p className="text-muted mb-1 fw-semibold">No expenses found.</p>

              <p className="small text-muted mb-0">
                Try adjusting your filters or item search.
              </p>
            </div>
          ) : (
            <div className="mcj-ui-table-shell mcj-expenses-table-shell">
              <ExpensesTable
                items={filteredExpenses}
                onEdit={startEdit}
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
