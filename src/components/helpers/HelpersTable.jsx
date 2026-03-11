function HelpersTable({ helpers, onEdit, onDelete, loading }) {
  if (loading) {
    return (
      <div className="card shadow-sm">
        <div className="card-body">Loading helpers...</div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header py-3">
        <h6 className="m-0 fw-bold text-primary">Helpers List</h6>
      </div>

      <div className="card-body">
        {helpers.length === 0 ? (
          <p className="mb-0">No helpers found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th style={{ width: "140px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {helpers.map((helper) => (
                  <tr key={helper.id}>
                    <td>
                      {[helper.first_name, helper.last_name]
                        .filter(Boolean)
                        .join(" ")}
                    </td>
                    <td>{helper.phone || "-"}</td>
                    <td>{helper.email || "-"}</td>
                    <td>
                      <span
                        className={`badge ${
                          helper.is_active ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {helper.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-warning"
                          onClick={() => onEdit(helper)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => onDelete(helper)}
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

export default HelpersTable;
