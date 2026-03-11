import { useEffect, useState } from "react";

const defaultFormData = {
  name: "",
  is_active: true,
};

function ClientForm({
  initialData = null,
  loading = false,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState(defaultFormData);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name ?? "",
        is_active:
          typeof initialData.is_active === "boolean"
            ? initialData.is_active
            : true,
      });
    } else {
      setFormData(defaultFormData);
    }

    setError("");
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      setError("Client name is required.");
      return;
    }

    setError("");

    await onSubmit({
      name: trimmedName,
      is_active: formData.is_active,
    });
  };

  return (
    <div className="card shadow mb-4">
      <div className="card-header py-3">
        <h6 className="m-0 font-weight-bold text-primary">
          {initialData ? "Edit Client" : "New Client"}
        </h6>
      </div>

      <div className="card-body">
        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-8">
              <label htmlFor="client-name" className="form-label">
                Client Name
              </label>
              <input
                id="client-name"
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter client name"
                disabled={loading}
                maxLength={150}
              />
            </div>

            <div className="col-md-4 d-flex align-items-end">
              <div className="form-check mb-2">
                <input
                  id="client-is-active"
                  type="checkbox"
                  name="is_active"
                  className="form-check-input"
                  checked={formData.is_active}
                  onChange={handleChange}
                  disabled={loading}
                />
                <label htmlFor="client-is-active" className="form-check-label">
                  Active
                </label>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 mt-4">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : initialData
                  ? "Update Client"
                  : "Save Client"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClientForm;
