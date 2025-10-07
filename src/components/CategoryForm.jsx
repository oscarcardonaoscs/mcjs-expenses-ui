import { useEffect } from "react";
import { useForm } from "react-hook-form";

export default function CategoryForm({
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
  } = useForm({
    defaultValues: { name: "" },
  });

  useEffect(() => {
    reset(initialValues || { name: "" });
  }, [initialValues, reset]);

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
          placeholder="e.g., Gas, Supplies, Insurance"
          autoFocus
        />
        {errors.name && (
          <div className="invalid-feedback">{errors.name.message}</div>
        )}
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
