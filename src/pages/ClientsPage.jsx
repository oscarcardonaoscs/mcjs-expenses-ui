import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClientForm from "../components/clients/ClientForm";
import ClientsTable from "../components/clients/ClientsTable";
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from "../services/clientsService";

function ClientsPage() {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return clients;
    }

    return clients.filter((client) => {
      const name = client.name?.toLowerCase() ?? "";
      const phone = client.phone?.toLowerCase() ?? "";
      const email = client.email?.toLowerCase() ?? "";

      return (
        name.includes(query) || phone.includes(query) || email.includes(query)
      );
    });
  }, [clients, searchTerm]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getClients();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load clients.");
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditingClient(null);
    setShowForm(true);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setShowForm(true);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLocations = (client) => {
    navigate(`/clients/${client.id}/locations`, {
      state: { client },
    });
  };

  const handleCancel = () => {
    setEditingClient(null);
    setShowForm(false);
    setError("");
  };

  const handleSubmit = async (payload) => {
    try {
      setFormLoading(true);
      setError("");

      if (editingClient) {
        await updateClient(editingClient.id, payload);
      } else {
        await createClient(payload);
      }

      setShowForm(false);
      setEditingClient(null);
      await loadClients();
    } catch (err) {
      setError(err.message || "Failed to save client.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (client) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete client "${client.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await deleteClient(client.id);
      await loadClients();
    } catch (err) {
      setError(err.message || "Failed to delete client.");
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  if (showForm) {
    return (
      <div className="container-fluid">
        <div className="mb-4">
          <div className="small mb-2">
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none"
              onClick={handleCancel}
              disabled={formLoading}
            >
              Clients
            </button>

            <span className="text-muted"> / </span>

            <span className="text-muted">
              {editingClient ? "Edit Client" : "Add Client"}
            </span>
          </div>

          <h1 className="h3 mb-1 text-gray-800">
            {editingClient ? "Edit Client" : "Add Client"}
          </h1>

          <p className="mb-0 text-muted">
            {editingClient
              ? "Update this client's information."
              : "Create a new client for helper time entries and future location management."}
          </p>
        </div>

        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}

        <ClientForm
          initialData={editingClient}
          loading={formLoading}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onBack={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <h1 className="h3 mb-1 text-gray-800">Clients</h1>

              <p className="mb-0 text-muted">
                Manage the client catalog used for helper time entries.
              </p>
            </div>

            <div className="w-100 w-md-auto">
              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={handleNew}
                disabled={loading}
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-8 col-lg-6">
              <label htmlFor="client-search" className="form-label">
                Search Clients
              </label>

              <input
                id="client-search"
                type="text"
                className="form-control"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by name, phone, or email..."
                disabled={loading}
              />
            </div>

            <div className="col-12 col-md-auto">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={handleClearSearch}
                disabled={loading || !searchTerm}
              >
                Clear
              </button>
            </div>

            <div className="col-12 col-md">
              <div className="text-muted small text-md-end">
                Showing {filteredClients.length} of {clients.length} clients
              </div>
            </div>
          </div>
        </div>
      </div>

      <ClientsTable
        clients={filteredClients}
        loading={loading}
        onEdit={handleEdit}
        onLocations={handleLocations}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default ClientsPage;
