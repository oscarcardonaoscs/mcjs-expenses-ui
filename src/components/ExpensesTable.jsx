import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatCurrency, formatDateMDY } from "@/lib/format";
import "./ExpensesTable.css";

function formatPayment(method, last4) {
  if (!method) return "—";
  return last4 ? `${method} **${last4}` : method;
}

function getCategory(record) {
  return record.category_name || record.category?.name || "Uncategorized";
}

function getType(record) {
  return record.expense_type || "—";
}

function getVendor(expense) {
  return expense.vendor_name || expense.vendor?.name || "—";
}

function getItemName(item) {
  return (
    item.expense_concept_name ||
    item.expense_concept?.name ||
    item.description ||
    "No description"
  );
}

function getItemDescription(item) {
  const conceptName =
    item.expense_concept_name || item.expense_concept?.name || "";
  const description = item.description?.trim() || "";
  if (!conceptName || !description) return null;
  return conceptName.trim().toLowerCase() === description.toLowerCase()
    ? null
    : description;
}

function getItems(expense) {
  return Array.isArray(expense.items) && expense.items.length > 0
    ? expense.items
    : [expense];
}

function getSummary(expense) {
  const lines = getItems(expense);
  const isSplit = lines.length > 1;
  return {
    lines,
    isSplit,
    categories: [...new Set(lines.map(getCategory))].join(", "),
    types: [...new Set(lines.map(getType))].join(", "),
    itemName: isSplit ? `${lines.length} items` : getItemName(lines[0]),
    itemDescription: isSplit ? null : getItemDescription(lines[0]),
  };
}

function ItemName({ itemName, itemDescription, strong = false }) {
  return (
    <div className="mcj-exp-item-name">
      <div
        className={
          strong ? "mcj-exp-item-primary fw-semibold" : "mcj-exp-item-primary"
        }
      >
        {itemName}
      </div>
      {itemDescription && (
        <div className="mcj-exp-item-secondary">{itemDescription}</div>
      )}
    </div>
  );
}

function ItemDetails({ lines }) {
  if (lines.length <= 1) return null;
  return (
    <details className="mcj-exp-details">
      <summary>View items ({lines.length})</summary>
      <div className="mcj-exp-lines">
        {lines.map((item, index) => (
          <div className="mcj-exp-line" key={item.id ?? index}>
            <div className="mcj-exp-line-content">
              <ItemName
                itemName={getItemName(item)}
                itemDescription={getItemDescription(item)}
                strong
              />
              <div className="mcj-exp-item-secondary">
                {getCategory(item)} · {getType(item)}
              </div>
            </div>
            <span className="mcj-exp-amount">{formatCurrency(item.total)}</span>
          </div>
        ))}
        <div className="mcj-exp-tax-note">
          Item totals include allocated tax.
        </div>
      </div>
    </details>
  );
}

// The action menu is rendered in a portal so horizontal table scrolling
// cannot cut it off. No Bootstrap dropdown plugin is required.
function ExpenseActions({ expense, onEdit, onDelete, isDeleting }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const hasActions = Boolean(onEdit || onDelete);

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (
        !buttonRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      )
        setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  if (!hasActions) return null;

  const toggleMenu = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 164;
      const menuHeight = (onEdit ? 42 : 0) + (onDelete ? 42 : 0) + 12;
      const top =
        rect.bottom + menuHeight + 8 > window.innerHeight
          ? Math.max(8, rect.top - menuHeight - 4)
          : rect.bottom + 4;
      setPosition({
        top,
        right: Math.max(8, window.innerWidth - rect.right),
        left: Math.max(8, rect.right - menuWidth),
      });
    }
    setOpen((previous) => !previous);
  };

  return (
    <>
      <button
        type="button"
        className="mcj-exp-action-trigger"
        ref={buttonRef}
        onClick={toggleMenu}
        disabled={isDeleting}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Expense actions"
        title="Expense actions"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>
      {open &&
        createPortal(
          <div
            className="mcj-exp-action-menu"
            ref={menuRef}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
            }}
            role="menu"
            aria-label="Expense actions"
          >
            {onEdit && (
              <button
                type="button"
                role="menuitem"
                disabled={isDeleting}
                onClick={() => {
                  setOpen(false);
                  onEdit(expense);
                }}
              >
                <span aria-hidden="true">✎</span> Edit expense
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                role="menuitem"
                className="mcj-exp-delete"
                disabled={isDeleting}
                onClick={() => {
                  setOpen(false);
                  onDelete(expense);
                }}
              >
                <span aria-hidden="true">×</span> Delete expense
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
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
    <div className="mcj-expenses-table-root">
      <div className="mcj-exp-desktop d-none d-md-block">
        <div className="mcj-exp-table-scroll">
          <table className="mcj-exp-table">
            <colgroup>
              <col className="mcj-exp-col-date" />
              <col className="mcj-exp-col-category" />
              <col className="mcj-exp-col-type" />
              <col className="mcj-exp-col-vendor" />
              <col className="mcj-exp-col-description" />
              <col className="mcj-exp-col-total" />
              <col className="mcj-exp-col-payment" />
              {hasActions && <col className="mcj-exp-col-actions" />}
            </colgroup>
            <thead>
              <tr>
                <th>Date</th>
                <th>Categories</th>
                <th>Type</th>
                <th>Vendor</th>
                <th>Description / Items</th>
                <th className="mcj-exp-number">Ticket Total</th>
                <th>Payment</th>
                {hasActions && (
                  <th className="mcj-exp-actions-column">
                    <span className="visually-hidden">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((expense) => {
                const summary = getSummary(expense);
                return (
                  <tr key={expense.id}>
                    <td className="mcj-exp-date">
                      {formatDateMDY(expense.date)}
                    </td>
                    <td>
                      <span className="mcj-exp-category">
                        {summary.categories}
                      </span>
                      {summary.isSplit && (
                        <div className="mcj-exp-multiple">Multiple items</div>
                      )}
                    </td>
                    <td className="mcj-exp-muted">{summary.types}</td>
                    <td className="mcj-exp-vendor">{getVendor(expense)}</td>
                    <td className="mcj-exp-description">
                      <ItemName
                        itemName={summary.itemName}
                        itemDescription={summary.itemDescription}
                        strong
                      />
                      <ItemDetails lines={summary.lines} />
                    </td>
                    <td className="mcj-exp-number mcj-exp-total">
                      {formatCurrency(expense.total)}
                    </td>
                    <td className="mcj-exp-muted mcj-exp-payment">
                      {formatPayment(
                        expense.payment_method,
                        expense.payment_account_last4,
                      )}
                    </td>
                    {hasActions && (
                      <td className="mcj-exp-actions-column">
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
      </div>

      <div className="mcj-exp-mobile d-md-none">
        {items.map((expense) => {
          const summary = getSummary(expense);
          return (
            <article className="mcj-exp-mobile-card" key={expense.id}>
              <div className="mcj-exp-mobile-top">
                <div>
                  <div className="mcj-exp-mobile-label">
                    {formatDateMDY(expense.date)}
                  </div>
                  <div className="mcj-exp-mobile-vendor">
                    {getVendor(expense)}
                  </div>
                </div>
                <div className="d-flex align-items-start gap-2">
                  <div className="mcj-exp-mobile-total">
                    {formatCurrency(expense.total)}
                  </div>
                  {hasActions && (
                    <ExpenseActions
                      expense={expense}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isDeleting={isDeleting}
                    />
                  )}
                </div>
              </div>
              <div className="mcj-exp-mobile-description">
                <ItemName
                  itemName={summary.itemName}
                  itemDescription={summary.itemDescription}
                  strong
                />
                <ItemDetails lines={summary.lines} />
              </div>
              <div className="mcj-exp-mobile-meta">
                <div>
                  <span>Categories</span>
                  <strong>{summary.categories}</strong>
                </div>
                <div>
                  <span>Type</span>
                  <strong>{summary.types}</strong>
                </div>
                <div>
                  <span>Payment</span>
                  <strong>
                    {formatPayment(
                      expense.payment_method,
                      expense.payment_account_last4,
                    )}
                  </strong>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
