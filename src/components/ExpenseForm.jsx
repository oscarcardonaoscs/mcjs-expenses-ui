// src/components/ExpenseForm.jsx
import { useEffect, useRef, useState } from "react";
import ExpenseConceptSelect from "./ExpenseConceptSelect";
import {
  useCategories,
  useVendors,
  usePaymentAccounts,
  useExpenseConcepts,
  useCreateExpenseConcept,
} from "@/api/hooks";

const asList = (data) => (Array.isArray(data) ? data : (data?.items ?? []));
const text = (value) => (value == null ? "" : String(value));
const normalize = (value) => text(value).trim().toLowerCase();
let nextKey = 0;

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Integer arithmetic: avoid binary floating-point rounding for money.
function scaled(value, decimals) {
  const match = /^(\d+)(?:\.(\d*))?$/.exec(text(value).trim());
  if (!match || (match[2]?.length ?? 0) > decimals) return null;
  return (
    BigInt(match[1]) * 10n ** BigInt(decimals) +
    BigInt((match[2] || "").padEnd(decimals, "0") || "0")
  );
}
function money(cents) {
  return `${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
}
function itemCents(item) {
  if (item.saved_subtotal != null) return scaled(item.saved_subtotal, 2);
  const qty = scaled(item.quantity, 3);
  const price = scaled(item.unit_price, 3);
  if (qty === null || price === null) return null;
  return (qty * price + 5000n) / 10000n;
}
function totalsFor(items, mode, taxValue, rateValue) {
  const subtotal = items.reduce(
    (sum, item) => sum + (itemCents(item) ?? 0n),
    0n,
  );
  const rate = scaled(rateValue, 2) ?? 0n;
  const tax =
    mode === "manual"
      ? (scaled(taxValue, 2) ?? 0n)
      : mode === "auto"
        ? (subtotal * rate + 5000n) / 10000n
        : 0n;
  return { subtotal, tax, total: subtotal + tax };
}
function categoryMode(name) {
  const n = normalize(name);
  if (/helper|payroll|labor|wages|sueldo|ayudante/.test(n)) return "helper";
  if (/car|gas|fuel|auto|veh[ií]culo/.test(n)) return "car";
  if (/suppl|insumo/.test(n)) return "supplies";
  return "general";
}
function newItem(source = {}) {
  const tax = scaled(source.tax_amount ?? "0", 2) ?? 0n;
  const total = scaled(source.total ?? "0", 2) ?? 0n;
  const savedSubtotal =
    source.subtotal != null
      ? text(source.subtotal)
      : source.total != null
        ? money(total >= tax ? total - tax : total)
        : null;
  const quantity = text(source.quantity ?? source.gallons_miles ?? "1");
  return {
    key: ++nextKey,
    category_id: text(source.category_id ?? source.category?.id),
    category_name: source.category_name || source.category?.name || "",
    expense_concept_id: text(source.expense_concept_id),
    expense_concept_name: source.expense_concept_name || "",
    expense_type: source.expense_type || "",
    description: source.description || "",
    // Existing subtotals are authoritative; do not recalculate them on open.
    saved_subtotal: savedSubtotal,
    quantity,
    unit_price: text(
      source.unit_price ?? (Number(quantity) === 1 ? savedSubtotal : ""),
    ),
    unit: source.unit || "",
    gallons_miles: text(source.gallons_miles),
    helper_name: source.helper_name || "",
    task_project: source.task_project || "",
  };
}
function initialState(expense) {
  const lines = expense?.items?.length
    ? expense.items
    : expense
      ? [expense]
      : [{}];
  return {
    date: expense?.date ? text(expense.date).slice(0, 10) : localToday(),
    vendor_id: text(expense?.vendor_id),
    payment_method: expense?.payment_method || "",
    payment_account_id: text(expense?.payment_account_id),
    receipt_url: expense?.receipt_url || "",
    notes: expense?.notes || "",
    tax_mode: "manual",
    tax_amount: text(expense?.tax_amount ?? "0.00"),
    tax_rate: "9.00",
    items: lines.map(newItem),
  };
}
function errorText(error) {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail))
    return detail.map((e) => `${(e.loc || []).join(".")}: ${e.msg}`).join("; ");
  return typeof detail === "string"
    ? detail
    : error?.message || "Unable to save. Please try again.";
}
function Field({ label, children, width = "col-12 col-md-6" }) {
  return (
    <div className={width}>
      <label className="form-label d-block">
        {label}
        {children}
      </label>
    </div>
  );
}

function ItemEditor({
  item,
  index,
  categories,
  onChange,
  onRemove,
  canRemove,
}) {
  const category = categories.find((c) => text(c.id) === item.category_id);
  const mode = categoryMode(category?.name || item.category_name);
  const fuel = mode === "car" && normalize(item.expense_type) === "fuel";
  const conceptQuery = useExpenseConcepts(
    item.category_id,
    Boolean(item.category_id) && !fuel,
  );
  const createConcept = useCreateExpenseConcept();
  const [localConcepts, setLocalConcepts] = useState([]);
  const [createName, setCreateName] = useState(null);
  const [conceptError, setConceptError] = useState("");
  const options = [...asList(conceptQuery.data), ...localConcepts].filter(
    (c) => text(c.category_id) === item.category_id,
  );
  if (
    item.expense_concept_id &&
    !options.some((c) => text(c.id) === item.expense_concept_id)
  ) {
    options.push({
      id: item.expense_concept_id,
      name:
        item.expense_concept_name ||
        `Saved concept #${item.expense_concept_id}`,
    });
  }
  const concepts = [...new Map(options.map((c) => [text(c.id), c])).values()];
  const types =
    mode === "car"
      ? [
          "Fuel",
          "Maintenance",
          "Parts",
          "Tools & Equipment",
          "Registration & Fees",
          "Insurance",
          "Other",
        ]
      : mode === "helper"
        ? ["Helpers"]
        : mode === "supplies"
          ? ["Supplies"]
          : [
              "General",
              "Insurance",
              "Legal/Government Fees",
              "Marketing",
              "Utilities",
              "Service",
              "Other",
            ];
  if (item.expense_type && !types.includes(item.expense_type))
    types.push(item.expense_type);
  const update = (name) => (e) => onChange({ [name]: e.target.value });
  const cents = itemCents(item);

  async function addConcept() {
    if (fuel || !createName?.trim() || createConcept.isPending) return;
    try {
      setConceptError("");
      const created = await createConcept.mutateAsync({
        category_id: Number(item.category_id),
        name: createName.trim(),
        is_active: true,
      });
      setLocalConcepts((prev) => [...prev, created]);
      onChange({
        expense_concept_id: text(created.id),
        expense_concept_name: created.name,
      });
      setCreateName(null);
    } catch (error) {
      setConceptError(errorText(error));
    }
  }

  return (
    <section className="border rounded-3 p-3 mb-3 bg-white">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h6 mb-0">Item {index + 1}</h3>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          disabled={!canRemove || createConcept.isPending}
          onClick={onRemove}
        >
          Remove
        </button>
      </div>
      <div className="row g-3">
        <Field label="Category">
          <select
            className="form-select mt-1"
            required
            value={item.category_id}
            disabled={createConcept.isPending}
            onChange={(e) => {
              const selected = categories.find(
                (c) => text(c.id) === e.target.value,
              );
              const kind = categoryMode(selected?.name);
              setCreateName(null);
              setConceptError("");
              onChange({
                category_id: e.target.value,
                category_name: selected?.name || "",
                expense_concept_id: "",
                expense_concept_name: "",
                expense_type:
                  kind === "car"
                    ? "Fuel"
                    : kind === "helper"
                      ? "Helpers"
                      : kind === "supplies"
                        ? "Supplies"
                        : "General",
              });
            }}
          >
            <option value="">— Select —</option>
            {item.category_id && !category && (
              <option value={item.category_id}>
                {item.category_name || `Saved category #${item.category_id}`}
              </option>
            )}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Expense Type">
          <select
            className="form-select mt-1"
            value={item.expense_type}
            disabled={createConcept.isPending}
            onChange={(event) => {
              const type = event.target.value;
              const isFuel = mode === "car" && normalize(type) === "fuel";
              setCreateName(null);
              setConceptError("");
              onChange({
                expense_type: type,
                ...(isFuel
                  ? { expense_concept_id: "", expense_concept_name: "" }
                  : {}),
              });
            }}
          >
            <option value="">— Optional —</option>
            {types.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </Field>
        {!fuel && (
          <div className="col-12">
            <ExpenseConceptSelect
              concepts={concepts}
              value={item.expense_concept_id}
              onChange={(id) =>
                onChange({
                  expense_concept_id: text(id),
                  expense_concept_name:
                    concepts.find((c) => text(c.id) === text(id))?.name || "",
                })
              }
              onCreate={(name = "") => {
                setCreateName(name);
                setConceptError("");
              }}
              isLoading={conceptQuery.isFetching}
              disabled={!item.category_id || createConcept.isPending}
            />
            {conceptQuery.isError && (
              <div className="text-danger small">
                Unable to load concepts. Please retry before changing the
                concept.
              </div>
            )}
          </div>
        )}
        {!fuel && createName !== null && (
          <>
            <div
              className="modal fade show d-block"
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`concept-modal-title-${item.key}`}
              onKeyDown={(event) => {
                if (event.key === "Escape" && !createConcept.isPending) {
                  event.preventDefault();
                  setCreateName(null);
                }
              }}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5
                      className="modal-title"
                      id={`concept-modal-title-${item.key}`}
                    >
                      Add an Expense Concept
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      aria-label="Close"
                      disabled={createConcept.isPending}
                      onClick={() => setCreateName(null)}
                    />
                  </div>
                  <div className="modal-body">
                    <p className="text-muted">
                      Add a concept for{" "}
                      <strong>
                        {category?.name ||
                          item.category_name ||
                          "this category"}
                      </strong>
                      .
                    </p>
                    <label
                      className="form-label"
                      htmlFor={`concept-modal-input-${item.key}`}
                    >
                      Concept
                    </label>
                    <input
                      id={`concept-modal-input-${item.key}`}
                      className={`form-control ${conceptError ? "is-invalid" : ""}`}
                      maxLength={150}
                      autoFocus
                      value={createName}
                      disabled={createConcept.isPending}
                      onChange={(event) => {
                        setCreateName(event.target.value);
                        setConceptError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addConcept();
                        }
                      }}
                    />
                    {conceptError && (
                      <div className="invalid-feedback" role="alert">
                        {conceptError}
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={createConcept.isPending}
                      onClick={() => setCreateName(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={createConcept.isPending || !createName.trim()}
                      onClick={addConcept}
                    >
                      {createConcept.isPending ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Adding...
                        </>
                      ) : (
                        "Add"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show" />
          </>
        )}
        <Field label="Description (optional)" width="col-12">
          <input
            className="form-control mt-1"
            maxLength={255}
            value={item.description}
            onChange={update("description")}
            placeholder="One product or a group of products"
          />
        </Field>
        <Field
          label={fuel ? "Gallons" : mode === "helper" ? "Hours" : "Quantity"}
          width="col-6 col-md-4"
        >
          <input
            className="form-control mt-1"
            type="number"
            min="0"
            step="0.001"
            required
            value={item.quantity}
            onChange={(e) =>
              onChange({
                quantity: e.target.value,
                saved_subtotal: null,
                ...(fuel
                  ? { gallons_miles: e.target.value, unit: "gallon" }
                  : {}),
              })
            }
          />
        </Field>
        <Field
          label={mode === "helper" ? "Hourly rate" : "Unit price"}
          width="col-6 col-md-4"
        >
          <input
            className="form-control mt-1"
            type="number"
            min="0"
            step="0.001"
            required={item.saved_subtotal == null}
            value={item.unit_price}
            onChange={(e) =>
              onChange({ unit_price: e.target.value, saved_subtotal: null })
            }
          />
        </Field>
        <Field label="Subtotal (before tax)" width="col-12 col-md-4">
          <input
            className="form-control mt-1 bg-light"
            readOnly
            value={cents === null ? "" : money(cents)}
          />
        </Field>
        {item.saved_subtotal != null &&
          itemCents({ ...item, saved_subtotal: null }) !== cents && (
            <div className="col-12 small text-muted">
              The saved subtotal is preserved. Changing quantity or unit price
              will recalculate it.
            </div>
          )}
        <div className="col-12">
          <details open={mode === "helper" ? true : undefined}>
            <summary className="small text-primary mb-2">
              Additional details
            </summary>
            <div className="row g-3">
              <Field label="Unit">
                <input
                  className="form-control mt-1"
                  maxLength={30}
                  value={item.unit}
                  onChange={update("unit")}
                  placeholder={
                    fuel ? "gallon" : mode === "helper" ? "hour" : "unit"
                  }
                />
              </Field>
              {mode === "helper" && (
                <>
                  <Field label="Helper name">
                    <input
                      className="form-control mt-1"
                      maxLength={100}
                      value={item.helper_name}
                      onChange={update("helper_name")}
                    />
                  </Field>
                  <Field label="Task / project">
                    <input
                      className="form-control mt-1"
                      maxLength={120}
                      value={item.task_project}
                      onChange={update("task_project")}
                    />
                  </Field>
                </>
              )}
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}

export default function ExpenseForm({
  onSubmit,
  isSubmitting = false,
  expenseToEdit = null,
  onCancelEdit,
  onCancel,
}) {
  const [form, setForm] = useState(() => initialState(expenseToEdit));
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);
  const identity = useRef(expenseToEdit?.id ?? null);
  const categoryQuery = useCategories();
  const vendorQuery = useVendors();
  const accountQuery = usePaymentAccounts(form.payment_method);
  const categories = asList(categoryQuery.data);
  const vendors = asList(vendorQuery.data);
  const accounts = asList(accountQuery.data);
  const busy = saving || isSubmitting;
  const totals = totalsFor(
    form.items,
    form.tax_mode,
    form.tax_amount,
    form.tax_rate,
  );
  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const change = (name) => (e) => set({ [name]: e.target.value });

  useEffect(() => {
    const next = expenseToEdit?.id ?? null;
    if (identity.current !== next) {
      identity.current = next;
      setForm(initialState(expenseToEdit));
      setSaveError("");
    }
  }, [expenseToEdit]);

  async function handleSave(event) {
    event.preventDefault();
    if (saveLock.current || isSubmitting) return;
    setSaveError("");
    try {
      if (typeof onSubmit !== "function")
        throw new Error("No save handler is configured.");
      if (form.tax_mode === "manual" && scaled(form.tax_amount, 2) === null)
        throw new Error("Enter a valid tax amount (two decimals).");
      if (
        form.tax_mode === "auto" &&
        (scaled(form.tax_rate, 2) === null || Number(form.tax_rate) > 100)
      )
        throw new Error("Enter a tax rate between 0 and 100.");
      const items = form.items.map((item, index) => {
        const cents = itemCents(item);
        if (!item.category_id || cents === null || cents < 0n)
          throw new Error(
            `Check the category and amount for item ${index + 1}.`,
          );
        for (const name of ["quantity", "unit_price", "gallons_miles"]) {
          if (item[name] !== "" && scaled(item[name], 3) === null)
            throw new Error(
              `Item ${index + 1}: ${name} must be nonnegative, with at most three decimals.`,
            );
        }
        const fuel = normalize(item.expense_type) === "fuel";
        return {
          category_id: Number(item.category_id),
          expense_concept_id: fuel
            ? null
            : item.expense_concept_id
              ? Number(item.expense_concept_id)
              : null,
          description: item.description.trim() || (fuel ? "Fuel" : null),
          expense_type: item.expense_type || null,
          quantity: item.quantity || null,
          unit_price: item.unit_price || null,
          unit:
            item.unit.trim() ||
            (fuel
              ? "gallon"
              : normalize(item.expense_type) === "helpers"
                ? "hour"
                : null),
          gallons_miles: fuel
            ? item.quantity || item.gallons_miles || null
            : item.gallons_miles || null,
          helper_name: item.helper_name.trim() || null,
          task_project: item.task_project.trim() || null,
          subtotal: money(cents),
        };
      });
      if (totals.subtotal <= 0n)
        throw new Error("The ticket subtotal must be greater than zero.");
      saveLock.current = true;
      setSaving(true);
      await onSubmit({
        ...(expenseToEdit?.id != null ? { id: expenseToEdit.id } : {}),
        date: form.date,
        vendor_id: form.vendor_id ? Number(form.vendor_id) : null,
        payment_method: form.payment_method || null,
        payment_account_id: form.payment_account_id
          ? Number(form.payment_account_id)
          : null,
        receipt_url: form.receipt_url.trim(),
        notes: form.notes.trim(),
        apply_tax: totals.tax > 0n,
        subtotal: money(totals.subtotal),
        tax_amount: money(totals.tax),
        total: money(totals.total),
        items,
      });
    } catch (error) {
      setSaveError(errorText(error));
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave}>
      {expenseToEdit && (
        <div className="alert alert-info">
          Editing expense #{expenseToEdit.id}. Saved subtotals and tax are
          preserved until you change them.
        </div>
      )}
      {saveError && (
        <div className="alert alert-danger" role="alert">
          {saveError}
        </div>
      )}
      {(categoryQuery.isError ||
        vendorQuery.isError ||
        accountQuery.isError) && (
        <div className="alert alert-warning">
          Some options could not be loaded. Saved selections are retained; retry
          before changing them.
        </div>
      )}
      <fieldset disabled={busy}>
        <section className="border rounded-3 p-3 mb-4">
          <h2 className="h5 mb-3">Purchase information</h2>
          <div className="row g-3">
            <Field label="Date">
              <input
                className="form-control mt-1"
                type="date"
                required
                value={form.date}
                onChange={change("date")}
              />
            </Field>
            <Field label="Vendor">
              <select
                className="form-select mt-1"
                value={form.vendor_id}
                onChange={change("vendor_id")}
              >
                <option value="">— Optional —</option>
                {form.vendor_id &&
                  !vendors.some((v) => text(v.id) === form.vendor_id) && (
                    <option value={form.vendor_id}>
                      {expenseToEdit?.vendor_name ||
                        expenseToEdit?.vendor?.name ||
                        `Saved vendor #${form.vendor_id}`}
                    </option>
                  )}
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Payment method">
              <select
                className="form-select mt-1"
                value={form.payment_method}
                onChange={(e) =>
                  set({
                    payment_method: e.target.value,
                    payment_account_id: "",
                  })
                }
              >
                <option value="">— Optional —</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK">Bank</option>
              </select>
            </Field>
            <Field label="Payment account">
              <select
                className="form-select mt-1"
                value={form.payment_account_id}
                onChange={change("payment_account_id")}
                disabled={!form.payment_method || accountQuery.isFetching}
              >
                <option value="">— Optional —</option>
                {form.payment_account_id &&
                  !accounts.some(
                    (a) => text(a.id) === form.payment_account_id,
                  ) && (
                    <option value={form.payment_account_id}>
                      Saved account #{form.payment_account_id}
                      {expenseToEdit?.payment_account_last4
                        ? ` · **${expenseToEdit.payment_account_last4}`
                        : ""}
                    </option>
                  )}
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                    {a.provider ? ` · ${a.provider}` : ""}
                    {a.last4 ? ` · **${a.last4}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Receipt link / reference" width="col-12">
              <input
                className="form-control mt-1"
                value={form.receipt_url}
                onChange={change("receipt_url")}
                placeholder="https://... or receipt reference"
              />
            </Field>
          </div>
        </section>
        <h2 className="h5">Expense items</h2>
        <p className="small text-muted">
          Subtotal = quantity × unit price, before tax. For a group of products,
          use quantity 1 and enter the group's amount as the unit price.
        </p>
        {form.items.map((item, index) => (
          <ItemEditor
            key={item.key}
            item={item}
            index={index}
            categories={categories}
            canRemove={form.items.length > 1}
            onChange={(patch) =>
              setForm((prev) => ({
                ...prev,
                items: prev.items.map((line) =>
                  line.key === item.key ? { ...line, ...patch } : line,
                ),
              }))
            }
            onRemove={() =>
              setForm((prev) => ({
                ...prev,
                items: prev.items.filter((line) => line.key !== item.key),
              }))
            }
          />
        ))}
        <button
          type="button"
          className="btn btn-outline-primary mb-4"
          onClick={() =>
            setForm((prev) => ({ ...prev, items: [...prev.items, newItem()] }))
          }
        >
          + Add item
        </button>
        <section className="border rounded-3 p-3 bg-light mb-3">
          <div className="row g-3">
            <Field label="Tax">
              <select
                className="form-select mt-1"
                value={form.tax_mode}
                onChange={change("tax_mode")}
              >
                <option value="manual">Enter receipt tax</option>
                <option value="auto">Calculate automatically</option>
                <option value="none">No tax</option>
              </select>
            </Field>
            {form.tax_mode === "manual" && (
              <Field label="Receipt tax ($)">
                <input
                  className="form-control mt-1"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.tax_amount}
                  onChange={change("tax_amount")}
                />
              </Field>
            )}
            {form.tax_mode === "auto" && (
              <Field label="Tax rate (%)">
                <input
                  className="form-control mt-1"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  value={form.tax_rate}
                  onChange={change("tax_rate")}
                />
              </Field>
            )}
          </div>
          <p className="small text-muted mt-3">
            Tax is distributed proportionally across all items by the backend.
            For mixed taxable and exempt items, that allocation may not match
            individual receipt taxes.
          </p>
          <div className="d-flex justify-content-between">
            <span>Subtotal</span>
            <strong>${money(totals.subtotal)}</strong>
          </div>
          <div className="d-flex justify-content-between">
            <span>Tax</span>
            <strong>${money(totals.tax)}</strong>
          </div>
          <div className="d-flex justify-content-between border-top pt-2 mt-2 fs-5">
            <span>Total</span>
            <strong>${money(totals.total)}</strong>
          </div>
        </section>
        <label className="form-label d-block">
          Notes
          <textarea
            className="form-control mt-1"
            rows={3}
            value={form.notes}
            onChange={change("notes")}
          />
        </label>
        <div className="d-flex gap-2 mt-3">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => (onCancel || onCancelEdit)?.()}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || categoryQuery.isLoading}
          >
            {busy
              ? "Saving…"
              : expenseToEdit
                ? "Update purchase"
                : "Save purchase"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
