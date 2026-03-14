function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-US");
}

function formatGroupDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

function formatDuration(startTime, endTime) {
  if (!startTime || !endTime) {
    return "-";
  }

  const [startHour, startMinute] = String(startTime).split(":").map(Number);
  const [endHour, endMinute] = String(endTime).split(":").map(Number);

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return "-";
  }

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  if (endTotalMinutes <= startTotalMinutes) {
    return "-";
  }

  const diff = endTotalMinutes - startTotalMinutes;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
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

function groupEntriesByDate(entries) {
  const groups = {};

  entries.forEach((entry) => {
    const key = entry.work_date || "unknown";

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(entry);
  });

  return Object.entries(groups).sort((a, b) => {
    if (a[0] < b[0]) return 1;
    if (a[0] > b[0]) return -1;
    return 0;
  });
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

  const groupedEntries = groupEntriesByDate(entries);

  return (
    <div className="card shadow mb-4">
      <div className="card-header py-3">
        <h6 className="m-0 fw-bold text-primary">Time Entries</h6>
      </div>

      <div className="card-body">
        {entries.length === 0 ? (
          <div className="text-muted">No time entries found.</div>
        ) : (
          <>
            <div className="d-block d-md-none">
              <div className="d-flex flex-column gap-4">
                {groupedEntries.map(([dateKey, items]) => (
                  <div key={dateKey}>
                    <h6 className="fw-bold text-muted mb-3">
                      {formatGroupDate(dateKey)}
                    </h6>

                    <div className="d-flex flex-column gap-3">
                      {items.map((entry) => (
                        <div
                          key={entry.id}
                          className="border rounded p-3 shadow-sm bg-white"
                        >
                          <div className="d-flex flex-column gap-1 mb-3">
                            <div className="fw-bold">
                              {getClientName(entry)}
                            </div>
                            <div className="text-muted small">
                              {getHelperName(entry.helper_id, helpers)}
                            </div>
                          </div>

                          <div className="mb-2">
                            <div className="small text-muted">Schedule</div>
                            <div className="fw-semibold">
                              {formatTime(entry.start_time)} {"→"}{" "}
                              {formatTime(entry.end_time)}
                            </div>
                          </div>

                          <div className="mb-2">
                            <div className="small text-muted">Duration</div>
                            <div>
                              {formatDuration(entry.start_time, entry.end_time)}
                            </div>
                          </div>

                          {entry.notes ? (
                            <div className="mb-3">
                              <div className="small text-muted">Notes</div>
                              <div>{entry.notes}</div>
                            </div>
                          ) : null}

                          <div className="d-grid gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => onEdit(entry)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => onDelete(entry)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="d-none d-md-block">
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
                      <th>Duration</th>
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
                        <td>
                          {formatDuration(entry.start_time, entry.end_time)}
                        </td>
                        <td>{entry.notes || "-"}</td>
                        <td>
                          <div className="d-flex gap-2 flex-wrap">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => onEdit(entry)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default HelperTimeEntriesTable;
