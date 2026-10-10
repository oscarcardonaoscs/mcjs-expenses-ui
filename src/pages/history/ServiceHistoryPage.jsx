import { useEffect, useState } from "react";

import { getClients } from "../../services/clientsService";
import { getServiceHistory } from "../../services/serviceHistoryService";

const SERVICE_TYPES = [
  "Regular",
  "Total",
  "Deep",
  "Move In",
  "Move Out",
  "Post Construction",
  "Airbnb Turnover",
];

const PAYMENT_STATUSES = ["Collected", "Pending", "Planned"];
const PAYMENT_METHODS = ["Cash", "Check", "Venmo", "Zelle"];

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultFilters() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    date_from: toDateInputValue(firstDay),
    date_to: toDateInputValue(today),
    client_id: "",
    service_type: "",
    payment_status: "",
    payment_method: "",
  };
}

function formatMoney(value) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value) {
  if (!value) return "—";

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDuration(minutes) {
  const total = Number(minutes || 0);

  if (total <= 0) return "—";

  const hours = Math.floor(total / 60);
  const remainingMinutes = total % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;

  return `${hours}h ${remainingMinutes}m`;
}

function getPaymentBadgeClass(status) {
  if (status === "Collected") return "text-bg-success";
  if (status === "Pending") return "text-bg-warning";
  return "text-bg-secondary";
}

function TeamList({ team }) {
  if (!Array.isArray(team) || team.length === 0) {
    return <span className="text-muted">—</span>;
  }

  return (
    <div className="d-flex flex-wrap gap-1">
      {team.map((member, index) => (
        <span
          key={`${member.name}-${index}`}
          className="badge rounded-pill text-bg-light border text-dark"
          title={`${member.name}: ${formatDuration(member.work_minutes)}`}
        >
          {member.name}
        </span>
      ))}
    </div>
  );
}

function SummaryCard({ label, value, tone = "primary" }) {
  return (
    <div className="col-6 col-xl-3">
      <div className={`card h-100 border-${tone} shadow-sm`}>
        <div className="card-body">
          <div className="small text-muted mb-1">{label}</div>
          <div className="h4 mb-0">{value}</div>
        </div>
      </div>
    </div>
  );
}

function ServiceHistoryPage() {
  const [filters, setFilters] = useState(getDefaultFilters);
  const [clients, setClients] = useState([]);
  const [history, setHistory] = useState({
    summary: {
      services: 0,
      total_amount: 0,
      collected_amount: 0,
      pending_amount: 0,
    },
    items: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const initialFilters = getDefaultFilters();

    async function loadInitialData() {
      try {
        setLoading(true);
        setError("");

        const [clientsData, historyData] = await Promise.all([
          getClients(),
          getServiceHistory(initialFilters),
        ]);

        setClients(Array.isArray(clientsData) ? clientsData : []);
        setHistory({
          summary: historyData?.summary || {},
          items: Array.isArray(historyData?.items) ? historyData.items : [],
        });
      } catch (err) {
        setError(err.message || "Failed to load service history.");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  const loadHistory = async (nextFilters) => {
    try {
      setLoading(true);
      setError("");

      const historyData = await getServiceHistory(nextFilters);

      setHistory({
        summary: historyData?.summary || {},
        items: Array.isArray(historyData?.items) ? historyData.items : [],
      });
    } catch (err) {
      setError(err.message || "Failed to load service history.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    await loadHistory(filters);
  };

  const handleClear = async () => {
    const clearedFilters = {
      date_from: "",
      date_to: "",
      client_id: "",
      service_type: "",
      payment_status: "",
      payment_method: "",
    };

    setFilters(clearedFilters);
    await loadHistory(clearedFilters);
  };

  const summary = history.summary || {};
  const items = Array.isArray(history.items) ? history.items : [];

  return (
    <div className="container-fluid py-3">
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h1 className="h3 mb-1">Service History</h1>
          <p className="text-muted mb-0">
            Review completed services, payments, and team participation.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="row g-3">
              <div className="col-6 col-xl-2">
                <label className="form-label" htmlFor="date_from">
                  Date From
                </label>
                <input
                  id="date_from"
                  name="date_from"
                  type="date"
                  className="form-control"
                  value={filters.date_from}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="col-6 col-xl-2">
                <label className="form-label" htmlFor="date_to">
                  Date To
                </label>
                <input
                  id="date_to"
                  name="date_to"
                  type="date"
                  className="form-control"
                  value={filters.date_to}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="col-12 col-md-6 col-xl-4">
                <label className="form-label" htmlFor="client_id">
                  Client
                </label>
                <select
                  id="client_id"
                  name="client_id"
                  className="form-select"
                  value={filters.client_id}
                  onChange={handleFilterChange}
                >
                  <option value="">All Clients</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-6 col-xl-4">
                <label className="form-label" htmlFor="service_type">
                  Service Type
                </label>
                <select
                  id="service_type"
                  name="service_type"
                  className="form-select"
                  value={filters.service_type}
                  onChange={handleFilterChange}
                >
                  <option value="">All Service Types</option>
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-6 col-xl-4">
                <label className="form-label" htmlFor="payment_status">
                  Payment Status
                </label>
                <select
                  id="payment_status"
                  name="payment_status"
                  className="form-select"
                  value={filters.payment_status}
                  onChange={handleFilterChange}
                >
                  <option value="">All Payment Statuses</option>
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-6 col-xl-4">
                <label className="form-label" htmlFor="payment_method">
                  Payment Method
                </label>
                <select
                  id="payment_method"
                  name="payment_method"
                  className="form-select"
                  value={filters.payment_method}
                  onChange={handleFilterChange}
                >
                  <option value="">All Payment Methods</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-xl-4 d-flex align-items-end">
                <div className="d-grid d-sm-flex gap-2 w-100">
                  <button
                    type="submit"
                    className="btn btn-primary flex-grow-1"
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Search"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary flex-grow-1"
                    onClick={handleClear}
                    disabled={loading}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <SummaryCard
          label="Services"
          value={Number(summary.services || 0).toLocaleString("en-US")}
        />
        <SummaryCard
          label="Service Amount"
          value={formatMoney(summary.total_amount)}
        />
        <SummaryCard
          label="Collected"
          value={formatMoney(summary.collected_amount)}
          tone="success"
        />
        <SummaryCard
          label="Pending"
          value={formatMoney(summary.pending_amount)}
          tone="warning"
        />
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <span className="fw-semibold">Services</span>
          <span className="text-muted small">{items.length} displayed</span>
        </div>

        {loading && items.length === 0 ? (
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="card-body text-center text-muted py-5">
            No services found for the selected filters.
          </div>
        ) : (
          <>
            <div className="table-responsive d-none d-lg-block">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Service</th>
                    <th className="text-end">Price</th>
                    <th>Duration</th>
                    <th>Team</th>
                    <th>Payment</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="text-nowrap">
                        {formatDate(item.work_date)}
                      </td>
                      <td>
                        <div className="fw-semibold">{item.client_name}</div>
                        {item.location_name && (
                          <div className="small text-muted">
                            {item.location_name}
                          </div>
                        )}
                      </td>
                      <td>
                        <div>{item.service_type || "—"}</div>
                        {item.service_frequency && (
                          <div className="small text-muted">
                            {item.service_frequency}
                          </div>
                        )}
                      </td>
                      <td className="text-end fw-semibold text-nowrap">
                        {item.service_amount === null ||
                        item.service_amount === undefined
                          ? "—"
                          : formatMoney(item.service_amount)}
                      </td>
                      <td className="text-nowrap">
                        {formatDuration(item.duration_minutes)}
                      </td>
                      <td style={{ minWidth: 180 }}>
                        <TeamList team={item.team} />
                      </td>
                      <td>
                        <span
                          className={`badge ${getPaymentBadgeClass(
                            item.payment_status,
                          )}`}
                        >
                          {item.payment_status || "—"}
                        </span>
                      </td>
                      <td>{item.payment_method || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-lg-none p-3">
              <div className="d-flex flex-column gap-3">
                {items.map((item) => (
                  <div key={item.id} className="card border shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between gap-3 mb-3">
                        <div>
                          <div className="fw-bold">{item.client_name}</div>
                          <div className="small text-muted">
                            {formatDate(item.work_date)}
                          </div>
                        </div>
                        <div className="text-end fw-bold">
                          {item.service_amount === null ||
                          item.service_amount === undefined
                            ? "—"
                            : formatMoney(item.service_amount)}
                        </div>
                      </div>

                      <div className="row g-3 small">
                        <div className="col-6">
                          <div className="text-muted">Service</div>
                          <div>{item.service_type || "—"}</div>
                          {item.service_frequency && (
                            <div className="text-muted">
                              {item.service_frequency}
                            </div>
                          )}
                        </div>
                        <div className="col-6">
                          <div className="text-muted">Duration</div>
                          <div>{formatDuration(item.duration_minutes)}</div>
                        </div>
                        <div className="col-6">
                          <div className="text-muted">Payment</div>
                          <span
                            className={`badge ${getPaymentBadgeClass(
                              item.payment_status,
                            )}`}
                          >
                            {item.payment_status || "—"}
                          </span>
                        </div>
                        <div className="col-6">
                          <div className="text-muted">Method</div>
                          <div>{item.payment_method || "—"}</div>
                        </div>
                        <div className="col-12">
                          <div className="text-muted mb-1">Team</div>
                          <TeamList team={item.team} />
                          {item.total_labor_minutes > 0 && (
                            <div className="text-muted mt-1">
                              Total labor:{" "}
                              {formatDuration(item.total_labor_minutes)}
                            </div>
                          )}
                        </div>
                      </div>

                      {item.notes && (
                        <div className="border-top mt-3 pt-3 small">
                          <span className="text-muted">Notes: </span>
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ServiceHistoryPage;
