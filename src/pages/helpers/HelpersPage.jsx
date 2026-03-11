import { useEffect, useState } from "react";
import HelperForm from "../../components/helpers/HelperForm";
import HelpersTable from "../../components/helpers/HelpersTable";
import {
  getHelpers,
  createHelper,
  updateHelper,
  deleteHelper,
} from "../../services/helpersService";

function HelpersPage() {
  const [helpers, setHelpers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingHelper, setEditingHelper] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHelpers();
  }, []);

  const loadHelpers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getHelpers();
      setHelpers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load helpers.");
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditingHelper(null);
    setShowForm(true);
    setError("");
  };

  const handleEdit = (helper) => {
    setEditingHelper(helper);
    setShowForm(true);
    setError("");
  };

  const handleCancel = () => {
    setEditingHelper(null);
    setShowForm(false);
    setError("");
  };

  const handleSubmit = async (formData) => {
    try {
      setFormLoading(true);
      setError("");

      if (editingHelper) {
        await updateHelper(editingHelper.id, formData);
      } else {
        await createHelper(formData);
      }

      setShowForm(false);
      setEditingHelper(null);
      await loadHelpers();
    } catch (err) {
      setError(err.message || "Failed to save helper.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (helper) => {
    const helperName = [helper.first_name, helper.last_name]
      .filter(Boolean)
      .join(" ");

    const confirmed = window.confirm(
      `Are you sure you want to delete helper "${helperName}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      await deleteHelper(helper.id);
      await loadHelpers();
    } catch (err) {
      setError(err.message || "Failed to delete helper.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-3">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-4">
        <h1 className="h3 mb-0">Helpers</h1>

        {!showForm && (
          <button type="button" className="btn btn-primary" onClick={handleNew}>
            New Helper
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {showForm ? (
        <HelperForm
          initialData={editingHelper}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={formLoading}
        />
      ) : (
        <HelpersTable
          helpers={helpers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      )}
    </div>
  );
}

export default HelpersPage;
