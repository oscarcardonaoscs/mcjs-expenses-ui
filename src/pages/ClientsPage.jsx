import { useEffect, useState } from "react";
import ClientForm from "../components/clients/ClientForm";
import ClientsTable from "../components/clients/ClientsTable";
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from "../services/clientsService";

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadClients();
  }, []);

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
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setShowForm(true);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  return (
    <div className="container-fluid">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h3 mb-0 text-gray-800">Clients</h1>
          <p className="mb-0 text-muted">
            Manage the client catalog used for helper time entries.
          </p>
        </div>

        {!showForm ? (
          <button type="button" className="btn btn-primary" onClick={handleNew}>
            Add Client
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

      {showForm ? (
        <ClientForm
          initialData={editingClient}
          loading={formLoading}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      ) : null}

      <ClientsTable
        clients={clients}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default ClientsPage;
