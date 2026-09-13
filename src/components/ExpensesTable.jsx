// src/components/ExpensesTable.jsx

import { formatCurrency, formatDateMDY } from "@/lib/format";

function formatPayment(method, last4) {
  if (!method) return "—";
  return last4 ? `${method} **${last4}` : method;
}

function getCategory(record) {
  return record.category_name || record.category?.name || "Uncategorized";
}

function getType(record) {
  return (
    record.expense_concept_name ||
    record.expense_concept?.name ||
    record.expense_type ||
    "—"
  );
}

function getVendor(expense) {
  return expense.vendor_name || expense.vendor?.name || "—";
}

function getItems(expense) {
  if (Array.isArray(expense.items) && expense.items.length > 0) {
    return expense.items;
  }

  // Compatibilidad con gastos antiguos sin partidas.
  return [expense];
}

function getSummary(expense) {
  const lines = getItems(expense);

  return {
    lines,
    isSplit: lines.length > 1,
    categories: [...new Set(lines.map(getCategory))].join(", "),
    types: [...new Set(lines.map(getType))].join(", "),
    description:
      lines.length > 1
        ? `${lines.length} items`
        : lines[0]?.description || "No description",
  };
}

function ItemDetails({ lines }) {
  if (lines.length <= 1) return null;

  return (
    <details className="mt-2">
      <summary className="small text-primary" style={{ cursor: "pointer" }}>
        View items ({lines.length})
      </summary>

      <div className="border rounded p-2 mt-2">
        {lines.map((item, index) => (
          <div
            key={item.id ?? index}
            className={index > 0 ? "border-top pt-2 mt-2" : ""}
          >
            <div className="d-flex justify-content-between gap-3">
              <div className="fw-semibold text-break">
                {item.description || getType(item)}
              </div>

              <div className="text-nowrap">{formatCurrency(item.total)}</div>
            </div>

            <div className="small text-muted text-break">
              {getCategory(item)} · {getType(item)}
            </div>
          </div>
        ))}

        <div className="small text-muted border-top pt-2 mt-2">
          Item totals include allocated tax.
        </div>
      </div>
    </details>
  );
}

function ExpenseActions({
  expense,
  onEdit,
  onDelete,
  isDeleting,
  mobile = false,
}) {
  const isSplit = getItems(expense).length > 1;

  if (!onEdit && !onDelete) return null;

  return (
    <div>
      <div className="d-flex gap-2 flex-wrap">
        {onEdit && (
          <button
            type="button"
            className={
              mobile
                ? "btn btn-outline-primary flex-fill"
                : "btn btn-sm btn-outline-primary"
            }
            disabled={isDeleting}
            onClick={() => onEdit(expense)}
          >
            Edit
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className={
              mobile
                ? "btn btn-outline-danger flex-fill"
                : "btn btn-sm btn-outline-danger"
            }
            disabled={isDeleting}
            onClick={() => onDelete(expense)}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export function ExpensesTable({
  items = [],
  onEdit,
  onDelete,
  isDeleting = false,
}) {
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <>
      {/* ================= DESKTOP ================= */}
      <div className="table-responsive d-none d-md-block">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th>Date</th>
              <th>Categories</th>
              <th>Type</th>
              <th>Vendor</th>
              <th>Description / Items</th>
              <th className="text-end pe-4">Ticket Total</th>
              <th className="ps-3">Payment</th>
              {hasActions && <th style={{ width: "170px" }}>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {items.map((expense) => {
              const summary = getSummary(expense);

              return (
                <tr key={expense.id}>
                  <td className="text-nowrap">{formatDateMDY(expense.date)}</td>

                  <td className="text-break">
                    {summary.categories}
                    {summary.isSplit && (
                      <div className="mt-1">
                        <span className="badge bg-light text-dark border">
                          Multiple items
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="text-break">{summary.types}</td>

                  <td className="text-break">{getVendor(expense)}</td>

                  <td style={{ minWidth: "220px" }}>
                    <div className="text-break">{summary.description}</div>
                    <ItemDetails lines={summary.lines} />
                  </td>

                  <td className="text-end pe-4 text-nowrap">
                    {formatCurrency(expense.total)}
                  </td>

                  <td className="ps-3">
                    {formatPayment(
                      expense.payment_method,
                      expense.payment_account_last4,
                    )}
                  </td>

                  {hasActions && (
                    <td>
                      <ExpenseActions
                        expense={expense}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        isDeleting={isDeleting}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE ================= */}
      <div className="d-md-none">
        <div className="d-flex flex-column gap-3">
          {items.map((expense) => {
            const summary = getSummary(expense);

            return (
              <article key={expense.id} className="card border shadow-sm">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div>
                      <div className="small text-muted">Date</div>
                      <div className="fw-semibold text-nowrap">
                        {formatDateMDY(expense.date)}
                      </div>
                    </div>

                    <div className="text-end flex-shrink-0">
                      <div className="small text-muted">Ticket Total</div>
                      <div className="fw-bold fs-5">
                        {formatCurrency(expense.total)}
                      </div>
                    </div>
                  </div>

                  <hr className="my-3" />

                  <div className="mb-3">
                    <div className="small text-muted mb-1">Vendor</div>
                    <div className="fw-semibold text-break">
                      {getVendor(expense)}
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <div className="small text-muted mb-1">Categories</div>
                      <div className="text-break">{summary.categories}</div>
                    </div>

                    <div className="col-6">
                      <div className="small text-muted mb-1">Type</div>
                      <div className="text-break">{summary.types}</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="small text-muted mb-1">
                      Description / Items
                    </div>
                    <div className="fw-semibold text-break">
                      {summary.description}
                    </div>
                    <ItemDetails lines={summary.lines} />
                  </div>

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

                  <ExpenseActions
                    expense={expense}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isDeleting={isDeleting}
                    mobile
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
