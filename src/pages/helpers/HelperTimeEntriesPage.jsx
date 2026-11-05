import { useEffect, useState } from "react";
import HelperTimeEntryForm from "../../components/helperTimeEntries/HelperTimeEntryForm";
import HelperTimeEntriesTable from "../../components/helperTimeEntries/HelperTimeEntriesTable";
import { getHelpers } from "../../services/helpersService";
import { getClients } from "../../services/clientsService";
import {
  getHelperTimeEntries,
  createHelperTimeEntry,
  getHelperWorkEvent,
  updateHelperWorkEvent,
  deleteHelperTimeEntry,
} from "../../services/helperTimeEntriesService";
import "../../styles/mcj-ui.css";

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEdit = async (entry) => {
    try {
      setFormLoading(true);
      setError("");

      if (!entry.work_event_id) {
        throw new Error("This time entry is not associated with a work event.");
      }

      const workEvent = await getHelperWorkEvent(entry.work_event_id);
      setEditingEntry(workEvent);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "Failed to load work event.");
    } finally {
      setFormLoading(false);
    }
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
        await updateHelperWorkEvent(editingEntry.id, payload);
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

    if (!confirmed) return;

    try {
      setError("");
      await deleteHelperTimeEntry(entry.id);
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to delete time entry.");
    }
  };

  return (
    <div className="w-100">
      <header className="mcj-page-header">
        <div>
          <h1 className="mcj-page-title">Helper Time Entries</h1>
          <p className="mcj-page-subtitle">
            Track work date, helper, client, and worked hours.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleNew}
            disabled={loading || formLoading}
          >
            <span aria-hidden="true" className="me-1">
              +
            </span>
            New Time Entry
          </button>
        )}
      </header>

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
          actionsDisabled={formLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

export default HelperTimeEntriesPage;
