import { useEffect } from "react";
import { useForm } from "react-hook-form";

const TYPES = ["CASH", "DEBIT", "CREDIT", "BANK"];

export default function PaymentAccountForm({
  initialValues,
  onSubmit,
  onCancel,
  loading,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      name: "",
      type: "CASH",
      provider: "",
      last4: "",
      currency: "USD",
      is_active: true,
    },
  });

  useEffect(() => {
    reset(
      initialValues || {
        name: "",
        type: "CASH",
        provider: "",
        last4: "",
        currency: "USD",
        is_active: true,
      }
    );
  }, [initialValues, reset]);

  const type = watch("type");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="row g-3">
      <div className="col-12">
        <label className="form-label">Name</label>
        <input
          className={`form-control ${errors.name ? "is-invalid" : ""}`}
          {...register("name", {
            required: "Required",
            maxLength: { value: 100, message: "Max 100 chars" },
          })}
          placeholder="e.g., MCJ Debit, Amex Business, Cash Box"
          autoFocus
        />
        {errors.name && (
          <div className="invalid-feedback">{errors.name.message}</div>
        )}
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label">Type</label>
        <select
          className="form-select"
          {...register("type", { required: true })}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label">Provider</label>
        <input
          className="form-control"
          placeholder={
            ["DEBIT", "CREDIT"].includes(type)
              ? "e.g., AMEX, Chase"
              : "Optional"
          }
          {...register("provider", { maxLength: 60 })}
        />
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label">Last 4</label>
        <input
          className={`form-control ${errors.last4 ? "is-invalid" : ""}`}
          placeholder="1234"
          {...register("last4", {
            validate: (v) => !v || /^\d{4}$/.test(v) || "4 digits",
          })}
        />
        {errors.last4 && (
          <div className="invalid-feedback">{errors.last4.message}</div>
        )}
      </div>

      <div className="col-12">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="is_active"
            {...register("is_active")}
          />
        </div>
        <label className="form-check-label" htmlFor="is_active">
          Active
        </label>
      </div>

      <div className="col-12 d-flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
