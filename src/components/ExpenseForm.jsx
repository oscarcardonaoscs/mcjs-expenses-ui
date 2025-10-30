// src/components/ExpenseForm.jsx
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useCategories, useVendors, usePaymentAccounts } from "@/api/hooks";

const TAX_RATE = 0.09;
const normalize = (s = "") => s.toString().trim().toLowerCase();

function inferModeFromCategoryName(name = "") {
  if (!name) return null;
  const n = normalize(name);

  // Supplies
  if (["supplies", "supply", "insumos"].some((k) => n.includes(k)))
    return "SUPPLIES";

  // General Expenses
  if (
    ["general expenses", "general", "gastos generales"].some((k) =>
      n.includes(k)
    )
  )
    return "GENERAL";

  // Car / Gasoline
  if (
    ["car", "gas", "gasoline", "fuel", "auto", "vehículo", "vehiculo"].some(
      (k) => n.includes(k)
    )
  )
    return "CAR";

  return "OTHER"; // fallback (se tratará como GENERAL)
}

export default function ExpenseForm({ onSubmit: submit, isSubmitting }) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      // comunes
      date: new Date().toISOString().slice(0, 10),
      category_id: "",
      vendor_id: "",
      payment_method: "",
      payment_account_id: "",
      receipt_url: "",
      description: "",
      notes: "",
      apply_tax: true,

      // SUPPLIES
      s_quantity: "",
      s_unit_price: "",

      // CAR
      gallons_miles: "",
      c_unit_price: "",
      c_expense_type: "Fuel", // Fuel | Maintenance | Other
      c_other_subtotal: "", // para Car -> Other (similar a General)

      // GENERAL
      g_subtotal: "",
      g_expense_type: "General",
    },
  });

  // Data
  const { data: categories = [] } = useCategories();
  const { data: vendors = [] } = useVendors();

  // Selección y modo
  const categoryId = watch("category_id");
  const selectedCategory = useMemo(
    () => categories.find((c) => String(c.id) === String(categoryId)),
    [categories, categoryId]
  );
  const mode = useMemo(
    () => inferModeFromCategoryName(selectedCategory?.name ?? ""),
    [selectedCategory]
  );
  const hasCategory = !!selectedCategory && !!mode;

  // Common watches
  const apply_tax = watch("apply_tax");
  const carType = watch("c_expense_type");
  const paymentMethod = watch("payment_method");

  // === Cuentas de pago filtradas por método ===
  const { data: paymentAccounts = [], isFetching: isLoadingAccounts } =
    usePaymentAccounts(paymentMethod);

  // Al cambiar el método, limpiar la cuenta seleccionada
  useEffect(() => {
    setValue("payment_account_id", "");
  }, [paymentMethod, setValue]);

  // === Cálculos por layout ===
  // SUPPLIES
  const sQty = Number(watch("s_quantity") || 0);
  const sUnitPrice = Number(watch("s_unit_price") || 0);
  const suppliesSubtotal = +(sQty * sUnitPrice).toFixed(2);
  const suppliesTax = +(apply_tax ? suppliesSubtotal * TAX_RATE : 0).toFixed(2);
  const suppliesTotal = +(suppliesSubtotal + suppliesTax).toFixed(2);

  // CAR - Fuel
  const gallons = Number(watch("gallons_miles") || 0);
  const cUnitPrice = Number(watch("c_unit_price") || 0);
  const carFuelSubtotal = +((gallons || 0) * (cUnitPrice || 0)).toFixed(2);
  const carFuelTax = +(apply_tax ? carFuelSubtotal * TAX_RATE : 0).toFixed(2);
  const carFuelTotal = +(carFuelSubtotal + carFuelTax).toFixed(2);

  // CAR - Maintenance
  const carMaintSubtotal = +((cUnitPrice || 0) * 1).toFixed(2);
  const carMaintTax = +(apply_tax ? carMaintSubtotal * TAX_RATE : 0).toFixed(2);
  const carMaintTotal = +(carMaintSubtotal + carMaintTax).toFixed(2);

  // CAR - Other (similar a General: se captura un Subtotal libre)
  const cOtherSubtotal = Number(watch("c_other_subtotal") || 0);
  const cOtherTax = +(apply_tax ? cOtherSubtotal * TAX_RATE : 0).toFixed(2);
  const cOtherTotal = +(cOtherSubtotal + cOtherTax).toFixed(2);

  // GENERAL
  const gSubtotal = Number(watch("g_subtotal") || 0);
  const gTax = +(apply_tax ? gSubtotal * TAX_RATE : 0).toFixed(2);
  const gTotal = +(gSubtotal + gTax).toFixed(2);

  // Label de Vendor (por si luego quieres diferenciar)
  const vendorLabel = useMemo(() => {
    if (mode === "CAR") return "Vendor";
    if (mode === "GENERAL") return "Vendor";
    if (mode === "SUPPLIES") return "Vendor";
    return "Vendor";
  }, [mode]);

  // Limpieza al cambiar categoría
  useEffect(() => {
    if (!hasCategory) return;
    // limpia campos variables
    setValue("description", "");
    setValue("notes", "");
    setValue("gallons_miles", "");
    setValue("c_unit_price", "");
    setValue("c_other_subtotal", "");
    setValue("s_quantity", "");
    setValue("s_unit_price", "");
    setValue("g_subtotal", "");
    setValue("g_expense_type", "General");
    setValue("c_expense_type", "Fuel");
    // no tocamos payment/receipt
  }, [hasCategory, setValue]);

  // === SUBMIT ===
  const onSubmit = async (data) => {
    if (!hasCategory) return;

    const tax_applied = !!data.apply_tax;
    const payment_method = data.payment_method || null;
    const payment_account_id = data.payment_account_id
      ? Number(data.payment_account_id)
      : null;

    let expense_type = null;
    let quantity = null;
    let unit = null;
    let unit_price = null;
    let gallons_miles = null;
    let total = null;
    let description = (data.description || "").trim();
    let receipt_url = data.receipt_url || "";
    let notes = (data.notes || "").trim();

    if (mode === "CAR") {
      expense_type = data.c_expense_type; // Fuel | Maintenance | Other

      if (expense_type === "Fuel") {
        // Gallons * Unit Price
        quantity = gallons || 0;
        unit = "gallon";
        unit_price = cUnitPrice || 0;
        gallons_miles = gallons || 0;
        total = carFuelTotal;
        description = "Fuel";
      } else if (expense_type === "Maintenance") {
        // Price (unit_price) * 1
        quantity = 1;
        unit = "unit";
        unit_price = cUnitPrice || 0;
        gallons_miles = 0;
        total = carMaintTotal;
        // description viene del input
      } else {
        // Other - similar a General (Subtotal libre)
        expense_type = "Other";
        quantity = 1;
        unit = "unit";
        unit_price = cOtherSubtotal || 0; // guardamos subtotal como unit_price * 1
        gallons_miles = 0;
        total = cOtherTotal;
      }
    } else if (mode === "GENERAL" || mode === "OTHER") {
      // General Expenses
      expense_type = data.g_expense_type || "General";
      quantity = 1;
      unit = "unit";
      unit_price = gSubtotal || 0; // subtotal capturado
      gallons_miles = 0;
      total = gTotal;
      // Por especificación, General NO envía receipt/notes
      receipt_url = "";
      notes = "";
    } else if (mode === "SUPPLIES") {
      // Supplies: qty * unit_price
      expense_type = "Supplies";
      quantity = sQty || 0;
      unit = "unit";
      unit_price = sUnitPrice || 0;
      gallons_miles = 0;
      total = suppliesTotal;
      // Por especificación, Supplies NO envía receipt/notes
      receipt_url = "";
      notes = "";
    }

    const payload = {
      date: data.date,
      category_id: data.category_id ? Number(data.category_id) : null,
      vendor_id: data.vendor_id ? Number(data.vendor_id) : null,

      description,
      notes,

      expense_type,
      quantity,
      unit,
      unit_price,
      gallons_miles,

      apply_tax: tax_applied,

      payment_method,
      payment_account_id,
      receipt_url,

      total,
    };

    console.log(
      "[ExpenseForm] SUBMIT payload:",
      JSON.stringify(payload, null, 2)
    );
    await submit?.(payload);

    // reset suave
    reset({
      date: getValues("date"),
      category_id: getValues("category_id"),
      vendor_id: getValues("vendor_id"),
      payment_method: "",
      payment_account_id: "",
      receipt_url: "",
      description: "",
      notes: "",
      apply_tax: tax_applied,

      s_quantity: "",
      s_unit_price: "",

      gallons_miles: "",
      c_unit_price: "",
      c_expense_type: "Fuel",
      c_other_subtotal: "",

      g_subtotal: "",
      g_expense_type: "General",
    });
  };

  // === UI helpers (secciones por orden exacto) ===
  const SectionHeader = () => (
    <>
      {/* Category */}
      <div className="col-12 col-md-3">
        <label className="form-label">Category</label>
        <select
          className="form-select"
          {...register("category_id", {
            setValueAs: (v) => (v === "" ? null : Number(v)),
          })}
        >
          <option value="">— Select —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );

  const CommonTotals = ({ subtotal, tax, total }) => (
    <>
      {/* Subtotal */}
      <div className="col-12 col-md-3">
        <label className="form-label">Subtotal</label>
        <div className="input-group">
          <span className="input-group-text">$</span>
          <input
            className="form-control"
            value={Number.isFinite(subtotal) ? subtotal : ""}
            readOnly
          />
        </div>
      </div>
      {/* Apply Tax */}
      <div className="col-12 col-md-3 d-flex align-items-end">
        <div className="form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="applyTax"
            {...register("apply_tax")}
          />
          <label className="form-check-label" htmlFor="applyTax">
            Apply Tax
          </label>
        </div>
      </div>

      {/* Tax (9%) */}
      <div className="col-12 col-md-3">
        <label className="form-label">Tax (9%)</label>
        <div className="input-group">
          <span className="input-group-text">$</span>
          <input
            className="form-control"
            value={Number.isFinite(tax) ? tax : ""}
            readOnly
          />
        </div>
      </div>

      {/* Total */}
      <div className="col-12 col-md-3">
        <label className="form-label">Total</label>
        <div className="input-group">
          <span className="input-group-text">$</span>
          <input
            className="form-control fw-bold"
            value={Number.isFinite(total) ? total : ""}
            readOnly
          />
        </div>
      </div>
    </>
  );

  const CommonPayments = ({
    includeReceiptAndNotes,
    paymentAccounts,
    isLoadingAccounts,
  }) => (
    <>
      {/* Payment Method */}
      <div className="col-12 col-md-3">
        <label className="form-label">Payment Method</label>
        <select className="form-select" {...register("payment_method")}>
          <option value="">— Optional —</option>
          <option value="CASH">Cash</option>
          <option value="CARD">Card</option>
        </select>
      </div>

      {/* Payment Account */}
      <div className="col-12 col-md-3">
        <label className="form-label d-flex align-items-center gap-2">
          <span>Payment Account</span>
          {isLoadingAccounts ? (
            <span className="spinner-border spinner-border-sm" />
          ) : null}
        </label>
        <select
          className="form-select"
          {...register("payment_account_id", {
            setValueAs: (v) => (v === "" ? null : Number(v)),
          })}
          disabled={!paymentMethod || isLoadingAccounts}
        >
          <option value="">— Optional —</option>
          {paymentAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
              {a.provider ? ` · ${a.provider}` : ""}
              {a.last4 ? ` · ••${a.last4}` : ""}
            </option>
          ))}
        </select>
      </div>

      {includeReceiptAndNotes ? (
        <>
          {/* Receipt */}
          <div className="col-12 col-md-6">
            <label className="form-label">Receipt</label>
            <input
              type="url"
              className="form-control"
              placeholder="https://... o referencia"
              {...register("receipt_url")}
            />
          </div>

          {/* Notes */}
          <div className="col-12">
            <label className="form-label">Notes</label>
            <input
              className="form-control"
              placeholder="Detalle adicional"
              {...register("notes")}
            />
          </div>
        </>
      ) : null}
    </>
  );

  // === RENDER ===
  return (
    <form className="row g-3" onSubmit={handleSubmit(onSubmit)}>
      {/* Header + Category */}
      <SectionHeader />

      {hasCategory && mode === "CAR" && (
        <>
          {/* Expense Type (dropdown) */}
          <div className="col-12 col-md-3">
            <label className="form-label">Expense Type</label>
            <select className="form-select" {...register("c_expense_type")}>
              <option>Fuel</option>
              <option>Maintenance</option>
              <option>Other</option>
            </select>
          </div>

          {/* Date */}
          <div className="col-12 col-md-3">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              {...register("date", { required: true })}
            />
          </div>

          {/* Vendor */}
          <div className="col-12 col-md-3">
            <label className="form-label">{vendorLabel}</label>
            <select
              className="form-select"
              {...register("vendor_id", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
            >
              <option value="">— Optional —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* === Fuel Layout === */}
          {carType === "Fuel" && (
            <>
              {/* Gallons */}
              <div className="col-12 col-md-3">
                <label className="form-label">Gallons</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  {...register("gallons_miles")}
                  placeholder="e.g., 12.5"
                />
              </div>

              {/* Unit Price */}
              <div className="col-12 col-md-3">
                <label className="form-label">Unit Price</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`form-control ${
                      errors.c_unit_price ? "is-invalid" : ""
                    }`}
                    {...register("c_unit_price", {
                      validate: (v) =>
                        v === "" || Number(v) >= 0 ? true : "Debe ser ≥ 0",
                    })}
                    placeholder="0.00"
                  />
                </div>
                {errors.c_unit_price && (
                  <div className="invalid-feedback">
                    {errors.c_unit_price.message}
                  </div>
                )}
              </div>

              <CommonTotals
                subtotal={carFuelSubtotal}
                tax={carFuelTax}
                total={carFuelTotal}
              />
              <CommonPayments
                includeReceiptAndNotes
                paymentAccounts={paymentAccounts}
                isLoadingAccounts={isLoadingAccounts}
              />
            </>
          )}

          {/* === Maintenance Layout === */}
          {carType === "Maintenance" && (
            <>
              {/* Description */}
              <div className="col-12">
                <label className="form-label">Description</label>
                <input
                  className="form-control"
                  placeholder="e.g., Oil change, tire rotation"
                  {...register("description")}
                />
              </div>

              {/* Price */}
              <div className="col-12 col-md-3">
                <label className="form-label">Price</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`form-control ${
                      errors.c_unit_price ? "is-invalid" : ""
                    }`}
                    {...register("c_unit_price", {
                      validate: (v) =>
                        v === "" || Number(v) >= 0 ? true : "Debe ser ≥ 0",
                    })}
                    placeholder="0.00"
                  />
                </div>
                {errors.c_unit_price && (
                  <div className="invalid-feedback">
                    {errors.c_unit_price.message}
                  </div>
                )}
              </div>

              <CommonTotals
                subtotal={carMaintSubtotal}
                tax={carMaintTax}
                total={carMaintTotal}
              />
              <CommonPayments
                includeReceiptAndNotes
                paymentAccounts={paymentAccounts}
                isLoadingAccounts={isLoadingAccounts}
              />
            </>
          )}

          {/* === Other Layout (similar a General) === */}
          {carType === "Other" && (
            <>
              {/* Description */}
              <div className="col-12">
                <label className="form-label">Description</label>
                <input
                  className="form-control"
                  placeholder="Describe the expense"
                  {...register("description")}
                />
              </div>

              {/* Subtotal (libre) */}
              <div className="col-12 col-md-3">
                <label className="form-label">Subtotal</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    {...register("c_other_subtotal")}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Totales */}
              <CommonTotals
                subtotal={cOtherSubtotal}
                tax={cOtherTax}
                total={cOtherTotal}
              />
              <CommonPayments
                includeReceiptAndNotes
                paymentAccounts={paymentAccounts}
                isLoadingAccounts={isLoadingAccounts}
              />
            </>
          )}
        </>
      )}

      {/* === GENERAL EXPENSES === */}
      {hasCategory && (mode === "GENERAL" || mode === "OTHER") && (
        <>
          {/* Expense Type */}
          <div className="col-12 col-md-3">
            <label className="form-label">Expense Type</label>
            <select className="form-select" {...register("g_expense_type")}>
              <option>General</option>
              <option>Utilities</option>
              <option>Service</option>
              <option>Office</option>
              <option>Other</option>
            </select>
          </div>

          {/* Date */}
          <div className="col-12 col-md-3">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              {...register("date", { required: true })}
            />
          </div>

          {/* Vendor */}
          <div className="col-12 col-md-3">
            <label className="form-label">{vendorLabel}</label>
            <select
              className="form-select"
              {...register("vendor_id", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
            >
              <option value="">— Optional —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="col-12">
            <label className="form-label">Description</label>
            <input
              className="form-control"
              placeholder="Describe the expense"
              {...register("description")}
            />
          </div>

          {/* Subtotal */}
          <div className="col-12 col-md-3">
            <label className="form-label">Subtotal</label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                {...register("g_subtotal")}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Totales */}
          <CommonTotals subtotal={gSubtotal} tax={gTax} total={gTotal} />

          {/* Pagos (sin Receipt/Notes en GENERAL por tu especificación) */}
          <CommonPayments
            includeReceiptAndNotes={false}
            paymentAccounts={paymentAccounts}
            isLoadingAccounts={isLoadingAccounts}
          />
        </>
      )}

      {/* === SUPPLIES === */}
      {hasCategory && mode === "SUPPLIES" && (
        <>
          {/* Date */}
          <div className="col-12 col-md-3">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              {...register("date", { required: true })}
            />
          </div>

          {/* Vendor */}
          <div className="col-12 col-md-3">
            <label className="form-label">{vendorLabel}</label>
            <select
              className="form-select"
              {...register("vendor_id", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
            >
              <option value="">— Optional —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="col-12">
            <label className="form-label">Description</label>
            <input
              className="form-control"
              placeholder="e.g., Paper towels"
              {...register("description")}
            />
          </div>

          {/* Quantity */}
          <div className="col-12 col-md-3">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              step="1"
              min="0"
              className="form-control"
              {...register("s_quantity")}
              placeholder="0"
            />
          </div>

          {/* Unit Price */}
          <div className="col-12 col-md-3">
            <label className="form-label">Unit Price</label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`form-control ${
                  errors.s_unit_price ? "is-invalid" : ""
                }`}
                {...register("s_unit_price", {
                  validate: (v) =>
                    v === "" || Number(v) >= 0 ? true : "Debe ser ≥ 0",
                })}
                placeholder="0.00"
              />
            </div>
            {errors.s_unit_price && (
              <div className="invalid-feedback">
                {errors.s_unit_price.message}
              </div>
            )}
          </div>

          {/* Totales */}
          <CommonTotals
            subtotal={suppliesSubtotal}
            tax={suppliesTax}
            total={suppliesTotal}
          />

          {/* Pagos (sin Receipt/Notes en SUPPLIES por tu especificación) */}
          <CommonPayments
            includeReceiptAndNotes={false}
            paymentAccounts={paymentAccounts}
            isLoadingAccounts={isLoadingAccounts}
          />
        </>
      )}

      {hasCategory && (
        <div className="col-12 d-flex gap-2">
          <button
            className="btn btn-primary"
            disabled={isSubmitting || !hasCategory}
          >
            <i className="bi bi-plus-circle me-2" />
            {isSubmitting ? "Guardando..." : "Guardar gasto"}
          </button>
        </div>
      )}
    </form>
  );
}
