function formatAddress(location) {
  const parts = [location.street_line1, location.street_line2].filter(Boolean);

  if (parts.length === 0) {
    return "-";
  }

  return parts.join(", ");
}

function formatSquareFeet(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return "-";
  }

  return `${numberValue.toLocaleString()} sqft`;
}

function ClientLocationsTable({
  locations = [],
  loading = false,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="card shadow mb-4">
        <div className="card-body">Loading locations...</div>
      </div>
    );
  }

  return (
    <div className="card shadow mb-4">
      <div className="card-header py-3">
        <h6 className="m-0 font-weight-bold text-primary">Locations</h6>
      </div>

      <div className="card-body">
        {locations.length === 0 ? (
          <div className="alert alert-info mb-0" role="alert">
            No locations found for this client.
          </div>
        ) : (
          <>
            {/* Mobile view */}
            <div className="d-block d-md-none">
              <div className="d-flex flex-column gap-3">
                {locations.map((location, index) => (
                  <div
                    key={location.id}
                    className="border rounded p-3 shadow-sm"
                  >
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <div>
                        <div className="small text-muted">
                          Location #{index + 1}
                        </div>

                        <div className="fw-bold">
                          {location.location_name || "Unnamed Location"}
                        </div>

                        <div className="small text-muted">
                          {formatAddress(location)}
                        </div>

                        <div className="small text-muted">
                          {location.city || "-"}
                        </div>
                        <div className="small text-muted">
                          <strong>Size:</strong>{" "}
                          {formatSquareFeet(location.square_feet)}
                        </div>
                      </div>

                      <span
                        className={`badge ${
                          location.is_primary
                            ? "text-bg-primary"
                            : "text-bg-secondary"
                        }`}
                      >
                        {location.is_primary ? "Primary" : "Secondary"}
                      </span>
                    </div>

                    <div className="d-grid gap-2 mt-3">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => onEdit(location)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onDelete(location)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop view */}
            <div className="d-none d-md-block">
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ minWidth: "70px" }}>#</th>
                      <th style={{ minWidth: "180px" }}>Location Name</th>
                      <th style={{ minWidth: "260px" }}>Address</th>
                      <th style={{ minWidth: "140px" }}>City</th>
                      <th style={{ minWidth: "120px" }}>Size</th>
                      <th style={{ minWidth: "110px" }}>Primary</th>
                      <th style={{ minWidth: "140px" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {locations.map((location, index) => (
                      <tr key={location.id}>
                        <td>{index + 1}</td>

                        <td>{location.location_name || "-"}</td>

                        <td>{formatAddress(location)}</td>

                        <td>{location.city || "-"}</td>
                        <td>{formatSquareFeet(location.square_feet)}</td>

                        <td>
                          <span
                            className={`badge ${
                              location.is_primary
                                ? "text-bg-primary"
                                : "text-bg-secondary"
                            }`}
                          >
                            {location.is_primary ? "Yes" : "No"}
                          </span>
                        </td>

                        <td>
                          <div className="d-flex flex-column gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => onEdit(location)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => onDelete(location)}
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

export default ClientLocationsTable;
