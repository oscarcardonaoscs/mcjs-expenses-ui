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

  const hasEntries =
    Array.isArray(payroll.time_entries) && payroll.time_entries.length > 0;

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog">
        <div
          className="modal-dialog modal-dialog-scrollable modal-fullscreen-sm-down modal-xl"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Payroll Period Details</h5>

              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              />
            </div>

            <div className="modal-body">
              <div className="row g-3 mb-4">
                <div className="col-12 col-lg-6">
                  <div className="card h-100 shadow-sm">
                    <div className="card-header py-3">
                      <h6 className="m-0 fw-bold text-primary">Period Info</h6>
                    </div>

                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-12 col-sm-6">
                          <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Helper</div>
                            <div className="fw-semibold">
                              {getHelperName(payroll)}
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-sm-6">
                          <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Status</div>
                            <div className="fw-semibold">
                              {payroll.status || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-sm-6">
                          <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Start Date</div>
                            <div>{formatDate(payroll.period_start)}</div>
                          </div>
                        </div>

                        <div className="col-12 col-sm-6">
                          <div className="border rounded p-3 h-100">
                            <div className="small text-muted">End Date</div>
                            <div>{formatDate(payroll.period_end)}</div>
                          </div>
                        </div>

                        <div className="col-12">
                          <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Pay Date</div>
                            <div>{formatDate(payroll.pay_date)}</div>
                          </div>
                        </div>

                        <div className="col-12">
                          <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Notes</div>
                            <div>{payroll.notes || "-"}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-lg-6">
                  <div className="card h-100 shadow-sm">
                    <div className="card-header py-3">
                      <h6 className="m-0 fw-bold text-primary">
                        Payroll Summary
                      </h6>
                    </div>

                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-6">
                          <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Work Hours</div>
                            <div className="fw-semibold">
                              {formatHoursFromMinutes(
                                payroll.total_work_minutes,
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="col-6">
                          <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Travel Hours</div>
                            <div className="fw-semibold">
                              {formatHoursFromMinutes(
                                payroll.total_travel_minutes,
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="col-6">
                          <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Work Pay</div>
                            <div className="fw-semibold">
                              {formatCurrency(payroll.work_amount)}
                            </div>
                          </div>
                        </div>

                        <div className="col-6">
                          <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Travel Pay</div>
                            <div className="fw-semibold">
                              {formatCurrency(payroll.travel_amount)}
                            </div>
                          </div>
                        </div>

                        <div className="col-12">
                          <div className="border rounded p-3 h-100 bg-light">
                            <div className="small text-muted">Total Pay</div>
                            <div className="fw-bold fs-5">
                              {formatCurrency(payroll.total_amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm">
                <div className="card-header py-3">
                  <h6 className="m-0 fw-bold text-primary">Time Entries</h6>
                </div>

                <div className="card-body">
                  {!hasEntries ? (
                    <div className="text-muted">
                      No time entries linked to this payroll period.
                    </div>
                  ) : (
                    <>
                      <div className="d-block d-md-none">
                        <div className="d-flex flex-column gap-3">
                          {payroll.time_entries.map((entry) => (
                            <div
                              key={entry.id}
                              className="border rounded p-3 shadow-sm"
                            >
                              <div className="fw-bold mb-1">
                                {formatDate(entry.work_date)}
                              </div>

                              <div className="text-muted small mb-3">
                                {entry.client_name || "-"}
                              </div>

                              <div className="row g-2">
                                <div className="col-6">
                                  <div className="small text-muted">Start</div>
                                  <div>{formatTime(entry.start_time)}</div>
                                </div>

                                <div className="col-6">
                                  <div className="small text-muted">End</div>
                                  <div>{formatTime(entry.end_time)}</div>
                                </div>

                                <div className="col-6">
                                  <div className="small text-muted">
                                    Duration
                                  </div>
                                  <div>
                                    {formatDurationFromMinutes(
                                      entry.work_minutes,
                                    )}
                                  </div>
                                </div>

                                <div className="col-6">
                                  <div className="small text-muted">
                                    Travel Time
                                  </div>
                                  <div>
                                    {formatDurationFromMinutes(
                                      entry.travel_minutes,
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="d-none d-md-block">
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
                                  <td>{formatDate(entry.work_date)}</td>
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
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer d-flex flex-column flex-sm-row gap-2">
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
