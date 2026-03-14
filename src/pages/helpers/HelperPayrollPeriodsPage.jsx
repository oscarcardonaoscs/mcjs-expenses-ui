import { useEffect, useState } from "react";
import HelperPayrollPeriodsTable from "../../components/helperPayrollPeriods/HelperPayrollPeriodsTable";
import HelperPayrollPeriodForm from "../../components/helperPayrollPeriods/HelperPayrollPeriodForm";
import HelperPayrollPeriodDetailsModal from "../../components/helperPayrollPeriods/HelperPayrollPeriodDetailsModal";
import { getHelpers } from "../../services/helpersService";
import {
  deleteHelperPayrollPeriod,
  generateHelperPayrollPeriod,
  getHelperPayrollPeriod,
  getHelperPayrollPeriods,
  markHelperPayrollPeriodPaid,
  updateHelperPayrollPeriod,
} from "../../services/helperPayrollPeriodsService";

function HelperPayrollPeriodsPage() {
  const [helpers, setHelpers] = useState([]);
  const [payrollPeriods, setPayrollPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [filters, setFilters] = useState({
    helper_id: "",
    status: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  const [showDetails, setShowDetails] = useState(false);
  const [detailsPayroll, setDetailsPayroll] = useState(null);

  useEffect(() => {
    loadHelpers();
  }, []);

  useEffect(() => {
    loadPayrollPeriods();
  }, [filters.helper_id, filters.status]);

  const loadHelpers = async () => {
    try {
      const data = await getHelpers();
      setHelpers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load helpers.");
    }
  };

  const loadPayrollPeriods = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getHelperPayrollPeriods({
        helper_id: filters.helper_id || undefined,
        status: filters.status || undefined,
      });

      setPayrollPeriods(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load payroll periods.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNew = () => {
    setSelectedPayroll(null);
    setFormMode("create");
    setShowForm(true);
    setSuccessMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEdit = async (payroll) => {
    try {
      setFormLoading(true);
      setError("");
      setSuccessMessage("");

      const fullPayroll = await getHelperPayrollPeriod(payroll.id);

      setSelectedPayroll(fullPayroll);
      setFormMode("edit");
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "Failed to load payroll period.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleView = async (payroll) => {
    try {
      setFormLoading(true);
      setError("");
      setSuccessMessage("");

      const fullPayroll = await getHelperPayrollPeriod(payroll.id);

      setDetailsPayroll(fullPayroll);
      setShowDetails(true);
    } catch (err) {
      setError(err.message || "Failed to load payroll period details.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleGenerate = async (payload) => {
    try {
      setFormLoading(true);
      setError("");
      setSuccessMessage("");

      await generateHelperPayrollPeriod(payload);

      setShowForm(false);
      setSelectedPayroll(null);
      setSuccessMessage("Payroll period generated successfully.");
      await loadPayrollPeriods();
    } catch (err) {
      setError(err.message || "Failed to generate payroll period.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (payrollId, payload) => {
    try {
      setFormLoading(true);
      setError("");
      setSuccessMessage("");

      await updateHelperPayrollPeriod(payrollId, payload);

      setShowForm(false);
      setSelectedPayroll(null);
      setSuccessMessage("Payroll period updated successfully.");
      await loadPayrollPeriods();
    } catch (err) {
      setError(err.message || "Failed to update payroll period.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (payroll) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this payroll period?",
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccessMessage("");

      await deleteHelperPayrollPeriod(payroll.id);
      setSuccessMessage("Payroll period deleted successfully.");
      await loadPayrollPeriods();
    } catch (err) {
      setError(err.message || "Failed to delete payroll period.");
    }
  };

  const handleMarkPaid = async (payroll) => {
    const payDate = window.prompt(
      "Enter pay date (YYYY-MM-DD):",
      payroll.pay_date || new Date().toISOString().slice(0, 10),
    );

    if (!payDate) return;

    try {
      setError("");
      setSuccessMessage("");

      await markHelperPayrollPeriodPaid(payroll.id, {
        pay_date: payDate,
      });

      setSuccessMessage("Payroll period marked as paid.");
      await loadPayrollPeriods();
    } catch (err) {
      setError(err.message || "Failed to mark payroll period as paid.");
    }
  };

  return (
    <div className="container-fluid py-3">
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <h1 className="h3 mb-1 text-gray-800">Helper Payroll Periods</h1>
              <p className="text-muted mb-0">
                Generate, review, and manage helper payroll periods.
              </p>
            </div>

            <div className="w-100 w-md-auto">
              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={handleNew}
              >
                New Payroll Period
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      <div className="card shadow-sm mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 fw-bold text-primary">Filters</h6>
        </div>

        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label htmlFor="helper_id" className="form-label">
                Helper
              </label>
              <select
                id="helper_id"
                name="helper_id"
                className="form-select"
                value={filters.helper_id}
                onChange={handleFilterChange}
              >
                <option value="">All Helpers</option>
                {helpers.map((helper) => (
                  <option key={helper.id} value={helper.id}>
                    {[helper.first_name, helper.last_name]
                      .filter(Boolean)
                      .join(" ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="form-select"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="calculated">Calculated</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <HelperPayrollPeriodsTable
        payrollPeriods={payrollPeriods}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onMarkPaid={handleMarkPaid}
        onDelete={handleDelete}
      />

      <HelperPayrollPeriodForm
        show={showForm}
        mode={formMode}
        helpers={helpers}
        payroll={selectedPayroll}
        formLoading={formLoading}
        onClose={() => {
          setShowForm(false);
          setSelectedPayroll(null);
        }}
        onGenerate={handleGenerate}
        onUpdate={handleUpdate}
      />

      <HelperPayrollPeriodDetailsModal
        show={showDetails}
        payroll={detailsPayroll}
        onClose={() => {
          setShowDetails(false);
          setDetailsPayroll(null);
        }}
      />
    </div>
  );
}

export default HelperPayrollPeriodsPage;
