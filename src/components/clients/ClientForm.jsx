import { useEffect, useState } from "react";

const defaultFormData = {
  name: "",
  phone: "",
  email: "",
  notes: "",
  is_active: true,
};

function ClientForm({
  initialData = null,
  loading = false,
  onSubmit,
  onCancel,
  onBack = null,
}) {
  const [formData, setFormData] = useState(defaultFormData);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name ?? "",
        phone: initialData.phone ?? "",
        email: initialData.email ?? "",
        notes: initialData.notes ?? "",
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
    const trimmedPhone = formData.phone.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedNotes = formData.notes.trim();

    if (!trimmedName) {
      setError("Client name is required.");
      return;
    }

    setError("");

    try {
      await onSubmit({
        name: trimmedName,
        phone: trimmedPhone || null,
        email: trimmedEmail || null,
        notes: trimmedNotes || null,
        is_active: formData.is_active,
      });
    } catch (err) {
      const message =
        err?.response?.data?.detail || err?.message || "Failed to save client.";

      setError(message);
    }
  };

  return (
    <div className="card shadow mb-4">
      <div className="card-body p-4">
        <div className="d-flex align-items-center gap-3 mb-4">
          <div
            className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center"
            style={{ width: "48px", height: "48px" }}
          >
            <i className="bi bi-people" />
          </div>

          <div>
            <h5 className="mb-1">Client Information</h5>
            <p className="mb-0 text-muted">
              Enter the details for the new client below.
            </p>
          </div>
        </div>

        <hr />

        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-12">
              <label htmlFor="client-name" className="form-label">
                Client Name <span className="text-danger">*</span>
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

            <div className="col-12 col-md-6">
              <label htmlFor="client-phone" className="form-label">
                Phone
              </label>
              <input
                id="client-phone"
                type="text"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(256) 555-1234"
                disabled={loading}
                maxLength={30}
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="client-email" className="form-label">
                Email
              </label>
              <input
                id="client-email"
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                placeholder="client@example.com"
                disabled={loading}
                maxLength={150}
              />
            </div>

            <div className="col-12">
              <label htmlFor="client-notes" className="form-label">
                Notes
              </label>
              <textarea
                id="client-notes"
                name="notes"
                className="form-control"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any notes about this client..."
                disabled={loading}
                rows={4}
              />
            </div>

            <div className="col-12">
              <label className="form-label d-block">Active Status</label>

              <div className="form-check">
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

              <div className="form-text">
                Inactive clients will not be available for selection.
              </div>
            </div>
          </div>

          <hr className="my-4" />

          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>

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
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClientForm;
