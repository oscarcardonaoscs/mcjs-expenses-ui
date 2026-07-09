// src/components/ExpensesTable.jsx
import { formatCurrency, formatDateMDY } from "@/lib/format";

function formatPayment(method, last4) {
  if (!method) return "";
  if (!last4) return method; // CASH, ZELLE, etc.
  return `${method} **${last4}`;
}

export function ExpensesTable({ items, onEdit, onDelete }) {
  return (
    <>
      {/* ========= Versión DESKTOP (md en adelante) ========= */}
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
            {items.map((e) => (
              <tr key={e.id}>
                <td>{formatDateMDY(e.date)}</td>
                <td>{e.category?.name}</td>
                <td>{e.expense_type}</td>
                <td>{e.vendor?.name}</td>
                <td>{e.description}</td>

                <td className="text-end pe-4">{formatCurrency(e.total)}</td>

                <td className="ps-3">
                  {e.payment_method}
                  {e.payment_account_last4 && (
                    <div className="small text-muted">
                      **{e.payment_account_last4}
                    </div>
                  )}
                </td>

                <td>
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onEdit(e)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete(e)}
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

      {/* ========= Versión MOBILE ========= */}
      <div className="table-responsive d-md-none">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Item</th>
              <th className="text-end">Total</th>
            </tr>
          </thead>

          <tbody>
            {items.map((e) => (
              <tr key={e.id}>
                <td>{formatDateMDY(e.date)}</td>

                <td>
                  <div>{e.category?.name}</div>
                  {e.expense_type && (
                    <div className="small text-muted">{e.expense_type}</div>
                  )}
                </td>

                <td>
                  <div>{e.description}</div>

                  {e.vendor?.name && (
                    <div className="small text-muted">{e.vendor.name}</div>
                  )}

                  <div className="d-flex gap-2 mt-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onEdit(e)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete(e)}
                    >
                      Delete
                    </button>
                  </div>
                </td>

                <td className="text-end">
                  <div>{formatCurrency(e.total)}</div>

                  {e.payment_method && (
                    <div className="small text-muted">
                      {formatPayment(e.payment_method, e.payment_account_last4)}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
