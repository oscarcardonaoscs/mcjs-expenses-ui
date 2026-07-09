function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString();
}

function getLocationsCount(client) {
  if (typeof client.locations_count === "number") {
    return client.locations_count;
  }

  if (typeof client.locationsCount === "number") {
    return client.locationsCount;
  }

  if (Array.isArray(client.locations)) {
    return client.locations.length;
  }

  return 0;
}

function formatLocationsLabel(count) {
  return count === 1 ? "1 location" : `${count} locations`;
}

function ClientsTable({
  clients = [],
  loading = false,
  onEdit,
  onLocations,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="card shadow mb-4">
        <div className="card-body">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="card shadow mb-4">
      <div className="card-header py-3">
        <h6 className="m-0 font-weight-bold text-primary">Clients</h6>
      </div>

      <div className="card-body">
        {clients.length === 0 ? (
          <div className="alert alert-info mb-0" role="alert">
            No clients found.
          </div>
        ) : (
          <>
            {/* Mobile view */}
            <div className="d-block d-md-none">
              <div className="d-flex flex-column gap-3">
                {clients.map((client, index) => {
                  const locationsCount = getLocationsCount(client);

                  return (
                    <div
                      key={client.id}
                      className="border rounded p-3 shadow-sm"
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <div>
                          <div className="small text-muted">
                            Client #{index + 1}
                          </div>

                          <div className="fw-bold">{client.name}</div>

                          <div className="small text-muted">
                            {formatLocationsLabel(locationsCount)}
                          </div>
                        </div>

                        <span
                          className={`badge ${
                            client.is_active
                              ? "text-bg-success"
                              : "text-bg-secondary"
                          }`}
                        >
                          {client.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="small text-muted mb-3">
                        <strong>Updated:</strong>{" "}
                        {formatDate(client.updated_at)}
                      </div>

                      <div className="d-grid gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => onEdit(client)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => onLocations(client)}
                        >
                          Locations
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => onDelete(client)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop view */}
            <div className="d-none d-md-block">
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ minWidth: "70px" }}>#</th>
                      <th style={{ minWidth: "240px" }}>Name</th>
                      <th style={{ minWidth: "140px" }}>Locations</th>
                      <th style={{ minWidth: "120px" }}>Status</th>
                      <th style={{ minWidth: "140px" }}>Updated</th>
                      <th style={{ minWidth: "180px" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {clients.map((client, index) => {
                      const locationsCount = getLocationsCount(client);

                      return (
                        <tr key={client.id}>
                          <td>{index + 1}</td>

                          <td>{client.name}</td>

                          <td>{formatLocationsLabel(locationsCount)}</td>

                          <td>
                            <span
                              className={`badge ${
                                client.is_active
                                  ? "text-bg-success"
                                  : "text-bg-secondary"
                              }`}
                            >
                              {client.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td>{formatDate(client.updated_at)}</td>

                          <td>
                            <div className="d-flex flex-column gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => onEdit(client)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => onLocations(client)}
                              >
                                Locations
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => onDelete(client)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

export default ClientsTable;
