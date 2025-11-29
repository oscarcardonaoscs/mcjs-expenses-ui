// src/components/ExpensesTable.jsx
import { formatCurrency, formatDateMDY } from "@/lib/format";

function formatPayment(method, last4) {
  if (!method) return "";
  if (!last4) return method; // CASH, ZELLE, etc.
  return `${method} ${last4}`;
}

export function ExpensesTable({ items }) {
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
              <th>Total</th>
              <th>Payment</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========= Versión MOBILE (solo 4 columnas) ========= */}
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
                {/* Date */}
                <td>{formatDateMDY(e.date)}</td>
                {/* Category + Type en dos renglones */}
                <td>
                  <div>{e.category?.name}</div>
                  {e.expense_type && (
                    <div className="small text-muted">{e.expense_type}</div>
                  )}
                </td>

                {/* Item = Description + Vendor en dos renglones */}
                <td>
                  <div>{e.description}</div>

                  {e.vendor?.name && (
                    <div className="small text-muted">{e.vendor.name}</div>
                  )}
                </td>

                {/* Total + Payment en dos renglones */}
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
