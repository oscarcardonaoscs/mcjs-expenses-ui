function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-US");
}

function formatTime(timeString) {
  if (!timeString) return "-";

  const parts = String(timeString).split(":");
  if (parts.length < 2) return timeString;

  const hours = Number(parts[0]);
  const minutes = parts[1];

  if (Number.isNaN(hours)) return timeString;

  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${minutes} ${suffix}`;
}

function getHelperName(helperId, helpers) {
  const helper = helpers.find((item) => Number(item.id) === Number(helperId));

  if (!helper) {
    return `Helper #${helperId}`;
  }

  return [helper.first_name, helper.last_name].filter(Boolean).join(" ");
}

function getClientName(entry) {
  return entry.client_name || entry.client?.name || "-";
}

function HelperTimeEntriesTable({
  entries = [],
  helpers = [],
  loading = false,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="card shadow mb-4">
        <div className="card-body">Loading time entries...</div>
      </div>
    );
  }

  return (
    <div className="card shadow mb-4">
      <div className="card-header py-3">
        <h6 className="m-0 fw-bold text-primary">Time Entries</h6>
      </div>

      <div className="card-body">
        {entries.length === 0 ? (
          <div className="text-muted">No time entries found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>#</th>
                  <th>Work Date</th>
                  <th>Client</th>
                  <th>Helper</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Notes</th>
                  <th style={{ width: "140px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={entry.id}>
                    <td>{index + 1}</td>
                    <td>{formatDate(entry.work_date)}</td>
                    <td>{getClientName(entry)}</td>
                    <td>{getHelperName(entry.helper_id, helpers)}</td>
                    <td>{formatTime(entry.start_time)}</td>
                    <td>{formatTime(entry.end_time)}</td>
                    <td>{entry.notes || "-"}</td>
                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-info"
                          onClick={() => onEdit(entry)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => onDelete(entry)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default HelperTimeEntriesTable;
