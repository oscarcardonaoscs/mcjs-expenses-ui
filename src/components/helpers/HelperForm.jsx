import { useEffect, useState } from "react";

const initialFormData = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  default_work_rate: "",
  default_travel_rate: "",
  notes: "",
  is_active: true,
};

function HelperForm({ initialData, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (initialData) {
      setFormData({
        first_name: initialData.first_name || "",
        last_name: initialData.last_name || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        default_work_rate: initialData.default_work_rate ?? "",
        default_travel_rate: initialData.default_travel_rate ?? "",
        notes: initialData.notes || "",
        is_active:
          typeof initialData.is_active === "boolean"
            ? initialData.is_active
            : true,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [initialData]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      ...formData,
      default_work_rate:
        formData.default_work_rate === ""
          ? null
          : Number(formData.default_work_rate),
      default_travel_rate:
        formData.default_travel_rate === ""
          ? null
          : Number(formData.default_travel_rate),
    });
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header py-3">
        <h6 className="m-0 fw-bold text-primary">
          {initialData ? "Edit Helper" : "New Helper"}
        </h6>
      </div>

      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label htmlFor="first_name" className="form-label">
                First Name
              </label>
              <input
                id="first_name"
                type="text"
                name="first_name"
                className="form-control"
                value={formData.first_name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="last_name" className="form-label">
                Last Name
              </label>
              <input
                id="last_name"
                type="text"
                name="last_name"
                className="form-control"
                value={formData.last_name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="phone" className="form-label">
                Phone
              </label>
              <input
                id="phone"
                type="text"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="default_work_rate" className="form-label">
                Default Work Rate
              </label>
              <input
                id="default_work_rate"
                type="number"
                name="default_work_rate"
                className="form-control"
                value={formData.default_work_rate}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="e.g. 15.00"
                disabled={loading}
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="default_travel_rate" className="form-label">
                Default Travel Rate
              </label>
              <input
                id="default_travel_rate"
                type="number"
                name="default_travel_rate"
                className="form-control"
                value={formData.default_travel_rate}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="e.g. 7.25"
                disabled={loading}
              />
            </div>

            <div className="col-12 col-md-6 d-flex align-items-md-end">
              <div className="form-check mt-2 mt-md-0">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  className="form-check-input"
                  checked={formData.is_active}
                  onChange={handleChange}
                  disabled={loading}
                />
                <label htmlFor="is_active" className="form-check-label">
                  Active
                </label>
              </div>
            </div>

            <div className="col-12">
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
              />
            </div>
          </div>

          <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : initialData
                  ? "Update Helper"
                  : "Save Helper"}
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

export default HelperForm;
