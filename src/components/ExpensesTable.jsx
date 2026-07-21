// src/components/ExpensesTable.jsx
import { formatCurrency, formatDateMDY } from "@/lib/format";

function formatPayment(method, last4) {
  if (!method) return "";
  if (!last4) return method;

  return `${method} **${last4}`;
}

export function ExpensesTable({ items, onEdit, onDelete }) {
  return (
    <>
      {/* ================= DESKTOP ================= */}
      <div className="table-responsive d-none d-md-block">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Type</th>
              <th>Vendor</th>
              <th>Description</th>
              <th className="text-end pe-4">Total</th>
              <th className="ps-3">Payment</th>
              <th style={{ width: "150px" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map((expense) => (
              <tr key={expense.id}>
                <td>{formatDateMDY(expense.date)}</td>

                <td>{expense.category?.name}</td>

                <td>{expense.expense_type}</td>

                <td>{expense.vendor?.name}</td>

                <td>{expense.description}</td>

                <td className="text-end pe-4">
                  {formatCurrency(expense.total)}
                </td>

                <td className="ps-3">
                  {expense.payment_method}

                  {expense.payment_account_last4 && (
                    <div className="small text-muted">
                      **{expense.payment_account_last4}
                    </div>
                  )}
                </td>

                <td>
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onEdit(expense)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete(expense)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE ================= */}
      <div className="d-md-none">
        <div className="d-flex flex-column gap-3">
          {items.map((expense) => (
            <article key={expense.id} className="card border shadow-sm">
              <div className="card-body p-3">
                {/* Primera fila: fecha y total */}
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div className="min-w-0">
                    <div className="small text-muted">Date</div>

                    <div className="fw-semibold text-nowrap">
                      {formatDateMDY(expense.date)}
                    </div>
                  </div>

                  <div className="text-end flex-shrink-0">
                    <div className="small text-muted">Total</div>

                    <div className="fw-bold fs-5">
                      {formatCurrency(expense.total)}
                    </div>
                  </div>
                </div>

                <hr className="my-3" />

                {/* Descripción */}
                <div className="mb-3">
                  <div className="small text-muted mb-1">Item</div>

                  <div className="fw-semibold text-break">
                    {expense.description || "No description"}
                  </div>

                  {expense.vendor?.name && (
                    <div className="small text-muted mt-1">
                      {expense.vendor.name}
                    </div>
                  )}
                </div>

                {/* Categoría y tipo */}
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <div className="small text-muted mb-1">Category</div>

                    <div className="text-break">
                      {expense.category?.name || "—"}
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="small text-muted mb-1">Type</div>

                    <div className="text-break">
                      {expense.expense_type || "—"}
                    </div>
                  </div>
                </div>

                {/* Forma de pago */}
                {expense.payment_method && (
                  <div className="mb-3">
                    <div className="small text-muted mb-1">Payment</div>

                    <div>
                      {formatPayment(
                        expense.payment_method,
                        expense.payment_account_last4,
                      )}
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary flex-fill"
                    onClick={() => onEdit(expense)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-danger flex-fill"
                    onClick={() => onDelete(expense)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
