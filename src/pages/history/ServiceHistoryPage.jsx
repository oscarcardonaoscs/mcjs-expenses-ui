import { useEffect, useState } from "react";
import "../../styles/mcj-ui.css";
import "./ServiceHistoryPage.css";

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

const PAYMENT_METHODS = ["Cash", "Cash App", "Check", "Venmo", "Zelle"];

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

function TeamList({ team }) {
  if (!Array.isArray(team) || team.length === 0) {
    return <span className="text-muted">—</span>;
  }

  return (
    <div className="d-flex flex-wrap gap-1 mcj-history-team">
      {team.map((member, index) => (
        <span
          key={`${member.name}-${index}`}
          className="mcj-ui-badge mcj-history-team-badge"
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
      <div className={`mcj-history-metric mcj-history-metric--${tone}`}>
        <div className="mcj-history-metric-label">{label}</div>
        <div className="mcj-history-metric-value">{value}</div>
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
    <div className="mcj-history-page">
      <header className="mcj-page-header">
        <div>
          <h1 className="mcj-page-title">Service History</h1>
          <p className="mcj-page-subtitle">
            Review completed services, payments, and team participation.
          </p>
        </div>
      </header>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <section
        className="mcj-ui-panel mcj-ui-filter-panel mcj-history-panel mcj-history-filters"
        aria-label="Service history filters"
      >
        <div className="mcj-history-panel-heading">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 7h16M7 12h10M10 17h4" />
          </svg>
          <h2>Filters</h2>
        </div>
        <form onSubmit={handleSearch}>
          <div className="row g-3">
            <div className="col-6 col-lg-4">
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
            <div className="col-6 col-lg-4">
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
            <div className="col-12 col-md-6 col-lg-4">
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
            <div className="col-12 col-md-6 col-lg-4">
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
            <div className="col-6 col-lg-4">
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
            <div className="col-6 col-lg-4">
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
          </div>
          <div className="mcj-history-filter-actions">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleClear}
              disabled={loading}
            >
              Clear Filters
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Loading..." : "Search"}
            </button>
          </div>
        </form>
      </section>

      <section
        className="row g-3 mcj-history-summary"
        aria-label="Service history summary"
      >
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
      </section>

      <section
        className="mcj-ui-panel mcj-history-panel mcj-history-results"
        aria-label="Services"
      >
        <div className="mcj-history-results-header">
          <h2>Services</h2>
          <span className="mcj-history-result-count">
            {items.length} displayed
          </span>
        </div>
        {loading && items.length === 0 ? (
          <div className="mcj-history-empty">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="mcj-history-empty">
            No services found for the selected filters.
          </div>
        ) : (
          <>
            <div className="table-responsive d-none d-lg-block mcj-history-table-scroll">
              <table className="table align-middle mb-0 mcj-ui-table mcj-history-table">
                <thead>
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
                      <td className="text-nowrap mcj-history-date">
                        {formatDate(item.work_date)}
                      </td>
                      <td className="mcj-history-client">
                        <div className="mcj-history-primary">
                          {item.client_name}
                        </div>
                        {item.location_name && (
                          <div className="mcj-history-secondary">
                            {item.location_name}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="mcj-history-service">
                          {item.service_type || "—"}
                        </div>
                        {item.service_frequency && (
                          <div className="mcj-history-secondary">
                            {item.service_frequency}
                          </div>
                        )}
                      </td>
                      <td className="text-end text-nowrap mcj-ui-amount mcj-history-amount">
                        {item.service_amount == null
                          ? "—"
                          : formatMoney(item.service_amount)}
                      </td>
                      <td className="text-nowrap mcj-history-muted">
                        {formatDuration(item.duration_minutes)}
                      </td>
                      <td>
                        <TeamList team={item.team} />
                      </td>
                      <td>
                        <span
                          className={`mcj-ui-badge mcj-history-status mcj-history-status--${(item.payment_status || "unknown").toLowerCase()}`}
                        >
                          {item.payment_status || "—"}
                        </span>
                      </td>
                      <td className="mcj-history-muted">
                        {item.payment_method || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="d-lg-none mcj-history-mobile-list">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="mcj-ui-mobile-card mcj-history-mobile-card"
                >
                  <div className="mcj-history-mobile-head">
                    <div>
                      <div className="mcj-history-primary">
                        {item.client_name}
                      </div>
                      <div className="mcj-history-secondary">
                        {formatDate(item.work_date)}
                      </div>
                      {item.location_name && (
                        <div className="mcj-history-secondary">
                          {item.location_name}
                        </div>
                      )}
                    </div>
                    <div className="mcj-ui-amount mcj-history-amount">
                      {item.service_amount == null
                        ? "—"
                        : formatMoney(item.service_amount)}
                    </div>
                  </div>
                  <div className="mcj-history-mobile-details">
                    <div>
                      <span>Service</span>
                      <strong>{item.service_type || "—"}</strong>
                      {item.service_frequency && (
                        <small>{item.service_frequency}</small>
                      )}
                    </div>
                    <div>
                      <span>Duration</span>
                      <strong>{formatDuration(item.duration_minutes)}</strong>
                    </div>
                    <div>
                      <span>Payment</span>
                      <span
                        className={`mcj-ui-badge mcj-history-status mcj-history-status--${(item.payment_status || "unknown").toLowerCase()}`}
                      >
                        {item.payment_status || "—"}
                      </span>
                    </div>
                    <div>
                      <span>Method</span>
                      <strong>{item.payment_method || "—"}</strong>
                    </div>
                  </div>
                  <div className="mcj-history-mobile-team">
                    <div className="mcj-history-secondary">Team</div>
                    <TeamList team={item.team} />
                    {item.total_labor_minutes > 0 && (
                      <div className="mcj-history-secondary">
                        Total labor: {formatDuration(item.total_labor_minutes)}
                      </div>
                    )}
                  </div>
                  {item.notes && (
                    <div className="mcj-history-mobile-notes">
                      <span>Notes: </span>
                      {item.notes}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default ServiceHistoryPage;
