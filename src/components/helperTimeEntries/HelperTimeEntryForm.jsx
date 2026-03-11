import { useEffect, useState } from "react";

const defaultFormData = {
  helper_id: "",
  work_date: "",
  client_id: "",
  start_time: "",
  end_time: "",
  notes: "",
};

function HelperTimeEntryForm({
  helpers = [],
  clients = [],
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
        helper_id: initialData.helper_id ?? "",
        work_date: initialData.work_date ?? "",
        client_id: initialData.client_id ?? "",
        start_time: initialData.start_time ?? "",
        end_time: initialData.end_time ?? "",
        notes: initialData.notes ?? "",
      });
    } else {
      setFormData(defaultFormData);
    }

    setError("");
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.helper_id) {
      setError("Please select a helper.");
      return;
    }

    if (!formData.work_date) {
      setError("Please select a work date.");
      return;
    }

    if (!formData.client_id) {
      setError("Please select a client.");
      return;
    }

    const hasStartTime = !!formData.start_time;
    const hasEndTime = !!formData.end_time;

    if (hasStartTime && !hasEndTime) {
      setError("End time is required when start time is provided.");
      return;
    }

    if (hasEndTime && !hasStartTime) {
      setError("Start time is required when end time is provided.");
      return;
    }

    if (
      hasStartTime &&
      hasEndTime &&
      formData.end_time <= formData.start_time
    ) {
      setError("End time must be later than start time.");
      return;
    }

    const payload = {
      helper_id: Number(formData.helper_id),
      work_date: formData.work_date,
      client_id: Number(formData.client_id),
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      notes: formData.notes?.trim() || "",
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || "Failed to save time entry.");
    }
  };

  return (
    <div className="card shadow mb-4">
      <div className="card-header py-3">
        <h6 className="m-0 fw-bold text-primary">
          {initialData ? "Edit Time Entry" : "New Time Entry"}
        </h6>
      </div>

      <div className="card-body">
        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="helper_id" className="form-label">
                Helper
              </label>
              <select
                id="helper_id"
                name="helper_id"
                className="form-select"
                value={formData.helper_id}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select a helper</option>
                {helpers.map((helper) => (
                  <option key={helper.id} value={helper.id}>
                    {[helper.first_name, helper.last_name]
                      .filter(Boolean)
                      .join(" ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="work_date" className="form-label">
                Work Date
              </label>
              <input
                id="work_date"
                type="date"
                name="work_date"
                className="form-control"
                value={formData.work_date}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="col-12 mb-3">
              <label htmlFor="client_id" className="form-label">
                Client
              </label>
              <select
                id="client_id"
                name="client_id"
                className="form-select"
                value={formData.client_id}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="start_time" className="form-label">
                Start Time
              </label>
              <input
                id="start_time"
                type="time"
                name="start_time"
                className="form-control"
                value={formData.start_time}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="end_time" className="form-label">
                End Time
              </label>
              <input
                id="end_time"
                type="time"
                name="end_time"
                className="form-control"
                value={formData.end_time}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="col-12 mb-3">
              <label htmlFor="notes" className="form-label">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                className="form-control"
                rows="3"
                value={formData.notes}
                onChange={handleChange}
                disabled={loading}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Saving..." : initialData ? "Update" : "Save"}
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

export default HelperTimeEntryForm;
