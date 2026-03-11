import { useEffect, useMemo, useState } from "react";

function formatCurrency(amount) {
  const value = Number(amount || 0);

  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function normalizeDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function formatTime(value) {
  if (!value) return "-";

  const [hours, minutes] = String(value).split(":");
  const date = new Date();
  date.setHours(Number(hours || 0), Number(minutes || 0), 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDurationFromMinutes(minutes) {
  const totalMinutes = Number(minutes || 0);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }

  return `${remainingMinutes}m`;
}

function formatHoursFromMinutes(minutes) {
  const totalMinutes = Number(minutes || 0);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(
    2,
    "0",
  )}`;
}

function HelperPayrollPeriodForm({
  show = false,
  mode = "create",
  helpers = [],
  payroll = null,
  formLoading = false,
  onClose,
  onGenerate,
  onUpdate,
}) {
  const [formData, setFormData] = useState({
    helper_id: "",
    period_start: "",
    period_end: "",
    pay_date: "",
    notes: "",
    status: "draft",
  });

  useEffect(() => {
    if (!show) return;

    if (mode === "edit" && payroll) {
      setFormData({
        helper_id: payroll.helper_id || "",
        period_start: normalizeDate(payroll.period_start),
        period_end: normalizeDate(payroll.period_end),
        pay_date: normalizeDate(payroll.pay_date),
        notes: payroll.notes || "",
        status: payroll.status ? String(payroll.status).toLowerCase() : "draft",
      });
    } else {
      setFormData({
        helper_id: "",
        period_start: "",
        period_end: "",
        pay_date: "",
        notes: "",
        status: "draft",
      });
    }
  }, [show, mode, payroll]);

  const summary = useMemo(() => {
    if (mode !== "edit" || !payroll) return null;

    return {
      total_entries: Array.isArray(payroll.time_entries)
        ? payroll.time_entries.length
        : 0,
      total_work_hours: formatHoursFromMinutes(payroll.total_work_minutes),
      total_travel_hours: formatHoursFromMinutes(payroll.total_travel_minutes),
      total_pay: Number(payroll.total_amount || 0),
    };
  }, [mode, payroll]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (mode === "edit") {
      await onUpdate(payroll.id, {
        helper_id: Number(formData.helper_id),
        period_start: formData.period_start,
        period_end: formData.period_end,
        pay_date: formData.pay_date || null,
        notes: formData.notes || null,
        status: formData.status || "draft",
      });
      return;
    }

    await onGenerate({
      helper_id: Number(formData.helper_id),
      period_start: formData.period_start,
      period_end: formData.period_end,
      pay_date: formData.pay_date || null,
    });
  };

  if (!show) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-xl" role="document">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {mode === "edit"
                    ? "Edit Payroll Period"
                    : "New Payroll Period"}
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  disabled={formLoading}
                  aria-label="Close"
                />
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="helper_id" className="form-label">
                    Helper *
                  </label>
                  <select
                    id="helper_id"
                    name="helper_id"
                    className="form-select"
                    value={formData.helper_id}
                    onChange={handleChange}
                    disabled={formLoading || mode === "edit"}
                    required
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

                <div className="row">
                  <div className="mb-3 col-md-4">
                    <label htmlFor="period_start" className="form-label">
                      Start Date *
                    </label>
                    <input
                      id="period_start"
                      name="period_start"
                      type="date"
                      className="form-control"
                      value={formData.period_start}
                      onChange={handleChange}
                      disabled={formLoading}
                      required
                    />
                  </div>

                  <div className="mb-3 col-md-4">
                    <label htmlFor="period_end" className="form-label">
                      End Date *
                    </label>
                    <input
                      id="period_end"
                      name="period_end"
                      type="date"
                      className="form-control"
                      value={formData.period_end}
                      onChange={handleChange}
                      disabled={formLoading}
                      required
                    />
                  </div>

                  <div className="mb-3 col-md-4">
                    <label htmlFor="pay_date" className="form-label">
                      Pay Date
                    </label>
                    <input
                      id="pay_date"
                      name="pay_date"
                      type="date"
                      className="form-control"
                      value={formData.pay_date}
                      onChange={handleChange}
                      disabled={formLoading}
                    />
                  </div>
                </div>

                {mode === "edit" && (
                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="status" className="form-label">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        className="form-select"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={formLoading}
                      >
                        <option value="open">Open</option>
                        <option value="ready">Ready</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                )}

                {summary && (
                  <div className="card border-info shadow-sm mb-3">
                    <div className="card-body">
                      <h6 className="fw-bold text-info mb-3">
                        Payroll Summary
                      </h6>

                      <div className="row">
                        <div className="col-md-3 mb-2">
                          <strong>Total Entries:</strong>{" "}
                          {summary.total_entries}
                        </div>
                        <div className="col-md-3 mb-2">
                          <strong>Work Hours:</strong>{" "}
                          {summary.total_work_hours}
                        </div>
                        <div className="col-md-3 mb-2">
                          <strong>Travel Hours:</strong>{" "}
                          {summary.total_travel_hours}
                        </div>
                        <div className="col-md-3 mb-2">
                          <strong>Total Pay:</strong>{" "}
                          {formatCurrency(summary.total_pay)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {mode === "edit" &&
                  Array.isArray(payroll?.time_entries) &&
                  payroll.time_entries.length > 0 && (
                    <div className="card shadow-sm">
                      <div className="card-header py-3">
                        <h6 className="m-0 fw-bold text-primary">
                          Time Entries
                        </h6>
                      </div>

                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-bordered table-sm mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Date</th>
                                <th>Client</th>
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th>Duration</th>
                                <th>Travel Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {payroll.time_entries.map((entry) => (
                                <tr key={entry.id}>
                                  <td>{normalizeDate(entry.work_date)}</td>
                                  <td>{entry.client_name || "-"}</td>
                                  <td>{formatTime(entry.start_time)}</td>
                                  <td>{formatTime(entry.end_time)}</td>
                                  <td>
                                    {formatDurationFromMinutes(
                                      entry.work_minutes,
                                    )}
                                  </td>
                                  <td>
                                    {formatDurationFromMinutes(
                                      entry.travel_minutes,
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={formLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Saving..."
                    : mode === "edit"
                      ? "Update Payroll Period"
                      : "Save and Calculate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" />
    </>
  );
}

export default HelperPayrollPeriodForm;
