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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEdit = (helper) => {
    setEditingHelper(helper);
    setShowForm(true);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <h1 className="h3 mb-1">Helpers</h1>
              <p className="text-muted mb-0">
                Manage helpers and their default rates.
              </p>
            </div>

            {!showForm && (
              <div className="w-100 w-md-auto">
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={handleNew}
                >
                  New Helper
                </button>
              </div>
            )}
          </div>
        </div>
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
