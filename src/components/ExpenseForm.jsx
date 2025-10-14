// src/components/ExpenseForm.jsx
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useCategories, useVendors } from "@/api/hooks";

const normalize = (s = "") => s.toString().trim().toLowerCase();

// 1) Si no hay nombre, regresar null para ocultar todo
function inferModeFromCategoryName(name = "") {
  if (!name) return null;
  const n = normalize(name);
  if (["supplies", "supply", "insumos"].some((k) => n.includes(k)))
    return "SUPPLIES";
  if (
    ["car", "gas", "gasoline", "fuel", "auto", "vehículo", "vehiculo"].some(
      (k) => n.includes(k)
    )
  )
    return "CAR";
  return "GENERAL"; // sólo si hay categoría pero no coincide con las anteriores
}

export default function ExpenseForm({ onSubmit: submit, isSubmitting }) {
  const { register, handleSubmit, reset, watch, setValue, getValues } = useForm(
    {
      defaultValues: {
        date: new Date().toISOString().slice(0, 10),
        total: "",
        notes: "",
        category_id: "",
        vendor_id: "",

        // SUPPLIES
        s_quantity: "",
        s_unit: "",
        s_unit_price: "",

        // CAR
        gallons_miles: "",
        c_unit_price: "",
        c_expense_type: "Fuel",

        // GENERAL
        g_expense_type: "General",

        // Comunes
        payment_method: "",
        receipt_url: "",
      },
    }
  );

  const {
    data: categories = [],
    isLoading: catLoading,
    isError: catError,
    error: catErr,
  } = useCategories();

  const {
    data: vendors = [],
    isLoading: venLoading,
    isError: venError,
    error: venErr,
  } = useVendors();

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

  // Cálculos en vivo
  const sQty = Number(watch("s_quantity") || 0);
  const sUnitPrice = Number(watch("s_unit_price") || 0);
  const suppliesTotal = useMemo(
    () => +(sQty * sUnitPrice).toFixed(2),
    [sQty, sUnitPrice]
  );

  const cQty = Number(watch("gallons_miles") || 0);
  const cUnitPrice = Number(watch("c_unit_price") || 0);
  const carTotal = useMemo(
    () => +(cQty * cUnitPrice).toFixed(2),
    [cQty, cUnitPrice]
  );

  const vendorLabel = useMemo(() => {
    if (mode === "CAR") return "Station/Vendor";
    if (mode === "GENERAL") return "Vendor/Service";
    return "Vendor";
  }, [mode]);

  const onSubmit = async (data) => {
    if (!hasCategory) return; // guard por si acaso

    let total = null;
    let notes = data.notes?.trim() ?? "";
    let expense_type = null;
    let quantity = null;
    let unit = null;
    let unit_price = null;
    let gallons_miles = null;
    const payment_method = data.payment_method || null;
    const receipt_url = data.receipt_url || null;
    const description = null;

    if (mode === "SUPPLIES") {
      total = sQty && sUnitPrice ? suppliesTotal : null;
      expense_type = "Supplies";
      quantity = data.s_quantity ? Number(data.s_quantity) : null;
      unit = data.s_unit || null;
      unit_price = data.s_unit_price !== "" ? Number(data.s_unit_price) : null;

      const extra = [
        `SUPPLIES`,
        `Qty: ${data.s_quantity || "-"}`,
        `Unit: ${data.s_unit || "-"}`,
        `Unit Price: ${data.s_unit_price || "-"}`,
        `Payment: ${data.payment_method || "-"}`,
        `receipt_url: ${data.receipt_url || "-"}`,
      ].join(" | ");
      notes = notes ? `${notes} — ${extra}` : extra;
    } else if (mode === "CAR") {
      total = cQty && cUnitPrice ? carTotal : null;
      expense_type = data.c_expense_type || "Fuel";
      gallons_miles =
        data.gallons_miles !== "" && data.gallons_miles != null
          ? Number(data.gallons_miles)
          : null;
      unit_price = data.c_unit_price !== "" ? Number(data.c_unit_price) : null;

      const extra = [
        `CAR/GAS`,
        `Type: ${data.c_expense_type || "-"}`,
        `Qty(Gal/Mi): ${data.gallons_miles || "-"}`,
        `Unit Price: ${data.c_unit_price || "-"}`,
        `Payment: ${data.payment_method || "-"}`,
        `receipt_url: ${data.receipt_url || "-"}`,
      ].join(" | ");
      notes = notes ? `${notes} — ${extra}` : extra;
    } else {
      // GENERAL
      total = data.total === "" ? null : Number(data.total);
      expense_type = data.g_expense_type || "General";
      const extra = [
        `GENERAL EXPENSE`,
        `Type: ${data.g_expense_type || "-"}`,
        `Payment: ${data.payment_method || "-"}`,
        `receipt_url: ${data.receipt_url || "-"}`,
      ].join(" | ");
      notes = notes ? `${notes} — ${extra}` : extra;
    }

    const payload = {
      date: data.date,
      total,
      notes,
      description,
      expense_type,
      quantity,
      unit,
      unit_price,
      gallons_miles,
      payment_method,
      receipt_url,
      category_id: data.category_id ?? null,
      vendor_id: data.vendor_id ?? null,
    };

    console.log(
      "[ExpenseForm] SUBMIT payload:",
      JSON.stringify(payload, null, 2)
    );

    await submit?.(payload);

    // reset suave: conserva fecha/categoría/proveedor
    reset({
      date: getValues("date"),
      category_id: getValues("category_id"),
      vendor_id: getValues("vendor_id"),
      total: "",
      notes: "",
      s_quantity: "",
      s_unit: "",
      s_unit_price: "",
      gallons_miles: "",
      c_unit_price: "",
      c_expense_type: "Fuel",
      g_expense_type: "General",
      payment_method: "",
      receipt_url: "",
    });
  };

  return (
    <form className="row g-3" onSubmit={handleSubmit(onSubmit)}>
      {/* Category (dispara el resto) */}
      <div className="col-12 col-md-3">
        <label className="form-label">Category</label>
        <select
          className="form-select"
          disabled={catLoading || catError}
          {...register("category_id", {
            setValueAs: (v) => (v === "" ? null : Number(v)),
            onChange: () => {
              // limpiar campos específicos al cambiar categoría
              [
                "total",
                "notes",
                "s_quantity",
                "s_unit",
                "s_unit_price",
                "gallons_miles",
                "c_unit_price",
              ].forEach((k) => setValue(k, ""));
              setValue("c_expense_type", "Fuel");
              setValue("g_expense_type", "General");
              setValue("payment_method", "");
              setValue("receipt_url", "");
            },
          })}
        >
          <option value="">— Selecciona —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {catError && (
          <div className="form-text text-danger">
            Error cargando categorías: {catErr?.message ?? "intenta de nuevo"}
          </div>
        )}
        {!hasCategory && (
          <div className="form-text">
            Selecciona una categoría para continuar.
          </div>
        )}
        {hasCategory && (
          <div className="form-text">
            Form layout: <strong>{mode}</strong>
          </div>
        )}
      </div>

      {/* 2) Todo lo demás sólo si hay categoría */}
      {hasCategory && (
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
              disabled={venLoading || venError}
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
            {venError && (
              <div className="form-text text-danger">
                Error cargando proveedores:{" "}
                {venErr?.message ?? "intenta de nuevo"}
              </div>
            )}
          </div>

          {/* Condicionales por modo */}
          {mode === "SUPPLIES" && (
            <>
              <div className="col-12 col-md-2">
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
              <div className="col-12 col-md-2">
                <label className="form-label">Unit</label>
                <input
                  className="form-control"
                  {...register("s_unit")}
                  placeholder="e.g., pack, box"
                />
              </div>
              <div className="col-12 col-md-2">
                <label className="form-label">Unit Price</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    {...register("s_unit_price")}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-12 col-md-2">
                <label className="form-label">Total</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    className="form-control"
                    value={Number.isFinite(suppliesTotal) ? suppliesTotal : ""}
                    readOnly
                  />
                </div>
              </div>
            </>
          )}

          {mode === "GENERAL" && (
            <>
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
              <div className="col-12 col-md-3">
                <label className="form-label">Total</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    {...register("total", {
                      setValueAs: (v) =>
                        v === "" || v === null ? "" : Number(v),
                      min: {
                        value: 0,
                        message: "El monto no puede ser negativo",
                      },
                    })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </>
          )}

          {mode === "CAR" && (
            <>
              <div className="col-12 col-md-3">
                <label className="form-label">Expense Type</label>
                <select className="form-select" {...register("c_expense_type")}>
                  <option>Fuel</option>
                  <option>Maintenance</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label">Gallons/Miles</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  {...register("gallons_miles")}
                  placeholder="e.g., 12.5"
                />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label">Unit Price</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    {...register("c_unit_price")}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label">Total</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    className="form-control"
                    value={Number.isFinite(carTotal) ? carTotal : ""}
                    readOnly
                  />
                </div>
              </div>
            </>
          )}

          {/* Comunes */}
          <div className="col-12 col-md-3">
            <label className="form-label">Payment Method</label>
            <select className="form-select" {...register("payment_method")}>
              <option value="">— Optional —</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
            </select>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">receipt_url</label>
            <input
              type="url"
              className="form-control"
              placeholder="https://... o referencia"
              {...register("receipt_url")}
            />
          </div>

          {/* Descripción / Notas */}
          <div className="col-12">
            <label className="form-label">Description / Notes</label>
            <input
              className="form-control"
              placeholder={
                mode === "CAR"
                  ? "e.g., Gas at Shell"
                  : mode === "SUPPLIES"
                  ? "e.g., Cleaning supplies"
                  : "e.g., Monthly service fee"
              }
              {...register("notes")}
            />
          </div>

          <div className="col-12">
            <button
              className="btn btn-primary"
              disabled={isSubmitting || !hasCategory}
            >
              <i className="bi bi-plus-circle me-2" />
              {isSubmitting ? "Guardando..." : "Agregar gasto"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
