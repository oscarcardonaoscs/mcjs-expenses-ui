function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString();
}

function formatCurrency(amount) {
  const value = Number(amount || 0);

  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
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

function getStatusBadgeClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "paid") return "badge bg-success";
  if (normalized === "approved") return "badge bg-warning text-dark";
  if (normalized === "calculated") return "badge bg-info text-dark";
  if (normalized === "ready") return "badge bg-info text-dark";
  if (normalized === "draft") return "badge bg-secondary";

  return "badge bg-light text-dark";
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

function HelperPayrollPeriodsTable({
  payrollPeriods = [],
  loading = false,
  onView,
  onEdit,
  onMarkPaid,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="card shadow mb-4">
        <div className="card-body">Loading payroll periods...</div>
      </div>
    );
  }

  return (
    <div className="card shadow mb-4">
      <div className="card-header py-3">
        <h6 className="m-0 text-primary">Payroll Periods</h6>
      </div>

      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-bordered table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Period</th>
                <th>Helper</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Pay Date</th>
                <th>Work Hours</th>
                <th>Travel Hours</th>
                <th>Total Pay</th>
                <th>Status</th>
                <th style={{ width: "240px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrollPeriods.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center">
                    No payroll periods found.
                  </td>
                </tr>
              ) : (
                payrollPeriods.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {formatDate(item.period_start)} -{" "}
                      {formatDate(item.period_end)}
                    </td>
                    <td>{getHelperName(item)}</td>
                    <td>{formatDate(item.period_start)}</td>
                    <td>{formatDate(item.period_end)}</td>
                    <td>{formatDate(item.pay_date)}</td>
                    <td>{formatHoursFromMinutes(item.total_work_minutes)}</td>
                    <td>{formatHoursFromMinutes(item.total_travel_minutes)}</td>
                    <td>{formatCurrency(item.total_amount)}</td>
                    <td>
                      <span className={getStatusBadgeClass(item.status)}>
                        {item.status || "-"}
                      </span>
                    </td>
                    <td>
                      <div
                        className="d-flex flex-wrap"
                        style={{ gap: "0.5rem" }}
                      >
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-info"
                          onClick={() => onView(item)}
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => onEdit(item)}
                        >
                          Edit
                        </button>

                        {String(item.status || "").toLowerCase() !== "paid" && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            onClick={() => onMarkPaid(item)}
                          >
                            Mark Paid
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => onDelete(item)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default HelperPayrollPeriodsTable;
