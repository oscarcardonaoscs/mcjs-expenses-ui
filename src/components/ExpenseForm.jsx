// src/components/ExpenseForm.jsx
import { useForm } from "react-hook-form";
import { useCategories, useVendors } from "@/api/hooks";

export default function ExpenseForm({ onSubmit: submit, isSubmitting }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  });

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

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      amount: data.amount === "" ? null : Number(data.amount),
      category_id: data.category_id === "" ? null : Number(data.category_id),
      vendor_id: data.vendor_id === "" ? null : Number(data.vendor_id),
    };
    await submit?.(payload);
    reset({ amount: "", note: "" }); // conserva fecha y selects
  };

  return (
    <form className="row g-3" onSubmit={handleSubmit(onSubmit)}>
      <div className="col-12 col-md-3">
        <label className="form-label">Fecha</label>
        <input
          type="date"
          className="form-control"
          {...register("date", { required: true })}
        />
      </div>

      <div className="col-12 col-md-3">
        <label className="form-label">Monto</label>
        <div className="input-group">
          <span className="input-group-text">$</span>
          <input
            type="number"
            step="0.01"
            className="form-control"
            {...register("amount", {
              setValueAs: (v) => (v === "" || v === null ? "" : Number(v)),
              min: { value: 0, message: "El monto no puede ser negativo" },
            })}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="col-12 col-md-3">
        <label className="form-label">Categoría</label>
        <select
          className="form-select"
          disabled={catLoading || catError}
          {...register("category_id", {
            setValueAs: (v) => (v === "" ? null : Number(v)),
          })}
        >
          <option value="">— Optional —</option>
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
      </div>

      <div className="col-12 col-md-3">
        <label className="form-label">Proveedor</label>
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
            Error cargando proveedores: {venErr?.message ?? "intenta de nuevo"}
          </div>
        )}
      </div>

      <div className="col-12">
        <label className="form-label">Nota</label>
        <input
          className="form-control"
          placeholder="e.g., Cleaning supplies"
          {...register("note")}
        />
      </div>

      <div className="col-12">
        <button className="btn btn-primary" disabled={isSubmitting}>
          <i className="bi bi-plus-circle me-2" />
          {isSubmitting ? "Guardando..." : "Agregar gasto"}
        </button>
      </div>
    </form>
  );
}
