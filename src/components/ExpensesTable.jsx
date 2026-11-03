import { formatCurrency, formatDateMDY } from "@/lib/format";

// ==========================================
// HELPERS
// ==========================================

function formatPayment(method, last4) {
  if (!method) return "—";

  return last4 ? `${method} **${last4}` : method;
}

function getCategory(record) {
  return record.category_name || record.category?.name || "Uncategorized";
}

// Type: Fuel, Supplies, etc.
function getType(record) {
  return record.expense_type || "—";
}

function getVendor(expense) {
  return expense.vendor_name || expense.vendor?.name || "—";
}

// Prioridad:
// 1. Expense Concept Name
// 2. Description
// 3. No description
function getItemName(item) {
  return (
    item.expense_concept_name ||
    item.expense_concept?.name ||
    item.description ||
    "No description"
  );
}

// Descripción secundaria, solamente cuando
// existe un concepto y la descripción aporta
// información adicional.
function getItemDescription(item) {
  const conceptName =
    item.expense_concept_name || item.expense_concept?.name || "";

  const description = item.description?.trim() || "";

  if (!conceptName || !description) {
    return null;
  }

  // Evitar mostrar dos veces el mismo texto.
  if (conceptName.trim().toLowerCase() === description.toLowerCase()) {
    return null;
  }

  return description;
}

// Compatibilidad con gastos antiguos
// que todavía no tienen partidas.
function getItems(expense) {
  if (Array.isArray(expense.items) && expense.items.length > 0) {
    return expense.items;
  }

  return [expense];
}

// Resumen del ticket
function getSummary(expense) {
  const lines = getItems(expense);

  const categories = [...new Set(lines.map(getCategory))].join(", ");

  const types = [...new Set(lines.map(getType))].join(", ");

  const isSplit = lines.length > 1;

  return {
    lines,
    isSplit,
    categories,
    types,
    itemName: isSplit ? `${lines.length} items` : getItemName(lines[0]),
    itemDescription: isSplit ? null : getItemDescription(lines[0]),
  };
}

// ==========================================
// ITEM NAME
// ==========================================

function ItemName({ itemName, itemDescription, strong = false }) {
  return (
    <div>
      <div className={strong ? "fw-semibold text-break" : "text-break"}>
        {itemName}
      </div>

      {itemDescription && (
        <div className="small text-muted text-break mt-1">
          {itemDescription}
        </div>
      )}
    </div>
  );
}

// ==========================================
// ITEM DETAILS
// ==========================================

function ItemDetails({ lines }) {
  if (lines.length <= 1) {
    return null;
  }

  return (
    <details className="mt-2">
      <summary className="small text-primary" style={{ cursor: "pointer" }}>
        View items ({lines.length})
      </summary>

      <div className="border rounded p-2 mt-2 bg-light">
        {lines.map((item, index) => {
          const itemName = getItemName(item);
          const itemDescription = getItemDescription(item);

          return (
            <div
              key={item.id ?? index}
              className={index > 0 ? "border-top pt-2 mt-2" : ""}
            >
              <div className="d-flex justify-content-between align-items-start gap-3">
                {/* CONCEPT / DESCRIPTION */}

                <div className="flex-grow-1">
                  <ItemName
                    itemName={itemName}
                    itemDescription={itemDescription}
                    strong
                  />

                  <div className="small text-muted text-break mt-1">
                    {getCategory(item)} · {getType(item)}
                  </div>
                </div>

                {/* ITEM TOTAL */}

                <div className="text-nowrap fw-semibold">
                  {formatCurrency(item.total)}
                </div>
              </div>
            </div>
          );
        })}

        <div className="small text-muted border-top pt-2 mt-2">
          Item totals include allocated tax.
        </div>
      </div>
    </details>
  );
}

// ==========================================
// EXPENSE ACTIONS
// ==========================================

function ExpenseActions({
  expense,
  onEdit,
  onDelete,
  isDeleting,
  mobile = false,
}) {
  if (!onEdit && !onDelete) {
    return null;
  }

  return (
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
  );
}

// ==========================================
// EXPENSES TABLE
// ==========================================

export function ExpensesTable({
  items = [],
  onEdit,
  onDelete,
  isDeleting = false,
}) {
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <>
      {/* =====================================
          DESKTOP
      ===================================== */}

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
                  {/* DATE */}

                  <td className="text-nowrap">{formatDateMDY(expense.date)}</td>

                  {/* CATEGORIES */}

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

                  {/* TYPE */}

                  <td className="text-break">{summary.types}</td>

                  {/* VENDOR */}

                  <td className="text-break">{getVendor(expense)}</td>

                  {/* DESCRIPTION / ITEMS */}

                  <td style={{ minWidth: "220px" }}>
                    <ItemName
                      itemName={summary.itemName}
                      itemDescription={summary.itemDescription}
                    />

                    <ItemDetails lines={summary.lines} />
                  </td>

                  {/* TICKET TOTAL */}

                  <td className="text-end pe-4 text-nowrap">
                    {formatCurrency(expense.total)}
                  </td>

                  {/* PAYMENT */}

                  <td className="ps-3">
                    {formatPayment(
                      expense.payment_method,
                      expense.payment_account_last4,
                    )}
                  </td>

                  {/* ACTIONS */}

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

      {/* =====================================
          MOBILE
      ===================================== */}

      <div className="d-md-none">
        <div className="d-flex flex-column gap-3">
          {items.map((expense) => {
            const summary = getSummary(expense);

            return (
              <article key={expense.id} className="card border shadow-sm">
                <div className="card-body p-3">
                  {/* DATE / TOTAL */}

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

                  {/* VENDOR */}

                  <div className="mb-3">
                    <div className="small text-muted mb-1">Vendor</div>

                    <div className="fw-semibold text-break">
                      {getVendor(expense)}
                    </div>
                  </div>

                  {/* CATEGORY / TYPE */}

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

                  {/* DESCRIPTION / ITEMS */}

                  <div className="mb-3">
                    <div className="small text-muted mb-1">
                      Description / Items
                    </div>

                    <ItemName
                      itemName={summary.itemName}
                      itemDescription={summary.itemDescription}
                      strong
                    />

                    <ItemDetails lines={summary.lines} />
                  </div>

                  {/* PAYMENT */}

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

                  {/* ACTIONS */}

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
