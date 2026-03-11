import { useEffect, useState } from "react";
import HelperTimeEntryForm from "../../components/helperTimeEntries/HelperTimeEntryForm";
import HelperTimeEntriesTable from "../../components/helperTimeEntries/HelperTimeEntriesTable";
import { getHelpers } from "../../services/helpersService";
import { getClients } from "../../services/clientsService";
import {
  getHelperTimeEntries,
  createHelperTimeEntry,
  updateHelperTimeEntry,
  deleteHelperTimeEntry,
} from "../../services/helperTimeEntriesService";

function HelperTimeEntriesPage() {
  const [entries, setEntries] = useState([]);
  const [helpers, setHelpers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [entriesData, helpersData, clientsData] = await Promise.all([
        getHelperTimeEntries(),
        getHelpers(),
        getClients(),
      ]);

      setEntries(Array.isArray(entriesData) ? entriesData : []);
      setHelpers(Array.isArray(helpersData) ? helpersData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (err) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditingEntry(null);
    setShowForm(true);
    setError("");
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setShowForm(true);
    setError("");
  };

  const handleCancel = () => {
    setEditingEntry(null);
    setShowForm(false);
    setError("");
  };

  const handleSubmit = async (payload) => {
    try {
      setFormLoading(true);
      setError("");

      if (editingEntry) {
        await updateHelperTimeEntry(editingEntry.id, payload);
      } else {
        await createHelperTimeEntry(payload);
      }

      await loadData();
      setShowForm(false);
      setEditingEntry(null);
    } catch (err) {
      setError(err.message || "Failed to save time entry.");
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (entry) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this time entry for ${entry.work_date}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await deleteHelperTimeEntry(entry.id);
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to delete time entry.");
    }
  };

  return (
    <div className="container-fluid py-3">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-4">
        <h1 className="h3 mb-0">Helper Time Entries</h1>

        {!showForm && (
          <button type="button" className="btn btn-primary" onClick={handleNew}>
            New Time Entry
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {showForm ? (
        <HelperTimeEntryForm
          helpers={helpers}
          clients={clients}
          initialData={editingEntry}
          loading={formLoading}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      ) : (
        <HelperTimeEntriesTable
          entries={entries}
          helpers={helpers}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

export default HelperTimeEntriesPage;
