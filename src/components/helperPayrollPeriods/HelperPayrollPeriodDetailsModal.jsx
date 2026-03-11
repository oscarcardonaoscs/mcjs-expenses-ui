function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString();
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

function formatCurrency(amount) {
  const value = Number(amount || 0);

  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function getHelperName(payroll) {
  if (payroll?.helper_name) return payroll.helper_name;

  if (payroll?.helper) {
    return [payroll.helper.first_name, payroll.helper.last_name]
      .filter(Boolean)
      .join(" ");
  }

  return payroll?.helper_id ? `Helper #${payroll.helper_id}` : "-";
}

function HelperPayrollPeriodDetailsModal({
  show = false,
  payroll = null,
  onClose,
}) {
  if (!show || !payroll) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-xl" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Payroll Period Details</h5>

              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>

            <div className="modal-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="card h-100 shadow-sm">
                    <div className="card-header py-3">
                      <h6 className="m-0 fw-bold text-primary">Period Info</h6>
                    </div>
                    <div className="card-body">
                      <p className="mb-2">
                        <strong>Helper:</strong> {getHelperName(payroll)}
                      </p>
                      <p className="mb-2">
                        <strong>Start Date:</strong>{" "}
                        {formatDate(payroll.period_start)}
                      </p>
                      <p className="mb-2">
                        <strong>End Date:</strong>{" "}
                        {formatDate(payroll.period_end)}
                      </p>
                      <p className="mb-2">
                        <strong>Pay Date:</strong>{" "}
                        {formatDate(payroll.pay_date)}
                      </p>
                      <p className="mb-2">
                        <strong>Status:</strong> {payroll.status || "-"}
                      </p>
                      <p className="mb-0">
                        <strong>Notes:</strong> {payroll.notes || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <div className="card h-100 shadow-sm">
                    <div className="card-header py-3">
                      <h6 className="m-0 fw-bold text-primary">
                        Payroll Summary
                      </h6>
                    </div>
                    <div className="card-body">
                      <p className="mb-2">
                        <strong>Work Hours:</strong>{" "}
                        {formatHoursFromMinutes(payroll.total_work_minutes)}
                      </p>
                      <p className="mb-2">
                        <strong>Travel Hours:</strong>{" "}
                        {formatHoursFromMinutes(payroll.total_travel_minutes)}
                      </p>
                      <p className="mb-2">
                        <strong>Work Pay:</strong>{" "}
                        {formatCurrency(payroll.work_amount)}
                      </p>
                      <p className="mb-2">
                        <strong>Travel Pay:</strong>{" "}
                        {formatCurrency(payroll.travel_amount)}
                      </p>
                      <p className="mb-0">
                        <strong>Total Pay:</strong>{" "}
                        {formatCurrency(payroll.total_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm">
                <div className="card-header py-3">
                  <h6 className="m-0 fw-bold text-primary">Time Entries</h6>
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
                        {!Array.isArray(payroll.time_entries) ||
                        payroll.time_entries.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center">
                              No time entries linked to this payroll period.
                            </td>
                          </tr>
                        ) : (
                          payroll.time_entries.map((entry) => (
                            <tr key={entry.id}>
                              <td>{formatDate(entry.work_date)}</td>
                              <td>{entry.client_name || "-"}</td>
                              <td>{formatTime(entry.start_time)}</td>
                              <td>{formatTime(entry.end_time)}</td>
                              <td>
                                {formatDurationFromMinutes(entry.work_minutes)}
                              </td>
                              <td>
                                {formatDurationFromMinutes(
                                  entry.travel_minutes,
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" />
    </>
  );
}

export default HelperPayrollPeriodDetailsModal;
