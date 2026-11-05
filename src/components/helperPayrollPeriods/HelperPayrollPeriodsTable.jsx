import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString();
}

function formatCurrency(amount) {
  const value = Number(amount || 0);
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatHoursFromMinutes(minutes) {
  const totalMinutes = Number(minutes || 0);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}

function getStatusBadgeClass(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "paid") return "mcj-ui-badge mcj-ui-badge--success";
  if (normalized === "approved") return "mcj-ui-badge mcj-ui-badge--warning";
  if (normalized === "calculated" || normalized === "ready")
    return "mcj-ui-badge bg-info-subtle text-info-emphasis";
  if (normalized === "draft") return "mcj-ui-badge mcj-ui-badge--neutral";
  return "mcj-ui-badge mcj-ui-badge--neutral";
}

function getHelperName(payroll) {
  if (payroll?.helper_name) return payroll.helper_name;
  if (payroll?.helper) {
    return [payroll.helper.first_name, payroll.helper.last_name]
      .filter(Boolean)
      .join(" ");
  }
  return payroll?.helper_id ? `Helper #${payroll.helper_id}` : "-";
}

function MoreIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function PayrollActions({ item, onView, onEdit, onMarkPaid, onDelete }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const isPaid = String(item.status || "").toLowerCase() === "paid";

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (
        !buttonRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const closeOnScroll = () => setOpen(false);
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", closeOnScroll);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", closeOnScroll);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [open]);

  const toggleMenu = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 190;
      const menuHeight = isPaid ? 130 : 170;
      setPosition({
        top:
          rect.bottom + menuHeight + 8 > window.innerHeight
            ? Math.max(8, rect.top - menuHeight - 4)
            : rect.bottom + 4,
        left: Math.max(
          8,
          Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
        ),
      });
    }
    setOpen((current) => !current);
  };

  const execute = (callback) => {
    setOpen(false);
    callback?.(item);
  };

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        className="mcj-ui-action-trigger"
        aria-label={`Actions for ${getHelperName(item)}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Payroll actions"
        onClick={toggleMenu}
      >
        <MoreIcon />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Actions for ${getHelperName(item)}`}
            className="mcj-ui-action-menu"
            style={{ top: position.top, left: position.left, width: 190 }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => execute(onView)}
            >
              View details
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => execute(onEdit)}
            >
              Edit period
            </button>
            {!isPaid && (
              <button
                type="button"
                role="menuitem"
                onClick={() => execute(onMarkPaid)}
              >
                Mark Paid
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              className="mcj-ui-danger"
              onClick={() => execute(onDelete)}
            >
              Delete period
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

function HelperPayrollPeriodsTable({
  payrollPeriods = [],
  loading = false,
  onView,
  onEdit,
  onMarkPaid,
  onDelete,
}) {
  if (loading) {
    return (
      <section className="mcj-ui-panel p-4" aria-live="polite">
        Loading payroll periods...
      </section>
    );
  }

  return (
    <section className="mcj-ui-table-shell mb-4" aria-label="Payroll periods">
      <div className="d-flex justify-content-between align-items-center gap-2 px-3 py-3 border-bottom">
        <div>
          <h2 className="fw-semibold fs-6 mb-1">Payroll Periods</h2>
          <span className="small text-muted">
            {payrollPeriods.length}{" "}
            {payrollPeriods.length === 1 ? "period" : "periods"}
          </span>
        </div>
      </div>

      {payrollPeriods.length === 0 ? (
        <div className="text-center text-muted small p-4">
          No payroll periods found.
        </div>
      ) : (
        <>
          <div className="d-none d-md-block mcj-ui-table-scroll">
            <table className="mcj-ui-table">
              <thead>
                <tr>
                  <th scope="col">Period</th>
                  <th scope="col">Helper</th>
                  <th scope="col">Start Date</th>
                  <th scope="col">End Date</th>
                  <th scope="col">Pay Date</th>
                  <th scope="col">Work Hours</th>
                  <th scope="col">Travel Hours</th>
                  <th scope="col" className="text-end">
                    Total Pay
                  </th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-center" style={{ width: 60 }}>
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {payrollPeriods.map((item) => (
                  <tr key={item.id}>
                    <td className="text-nowrap mcj-ui-muted">
                      {formatDate(item.period_start)} -{" "}
                      {formatDate(item.period_end)}
                    </td>
                    <td className="fw-semibold">{getHelperName(item)}</td>
                    <td className="text-nowrap">
                      {formatDate(item.period_start)}
                    </td>
                    <td className="text-nowrap">
                      {formatDate(item.period_end)}
                    </td>
                    <td className="text-nowrap">{formatDate(item.pay_date)}</td>
                    <td className="text-nowrap">
                      {formatHoursFromMinutes(item.total_work_minutes)}
                    </td>
                    <td className="text-nowrap">
                      {formatHoursFromMinutes(item.total_travel_minutes)}
                    </td>
                    <td className="text-end mcj-ui-amount">
                      {formatCurrency(item.total_amount)}
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(item.status)}>
                        {item.status || "-"}
                      </span>
                    </td>
                    <td className="text-center">
                      <PayrollActions
                        item={item}
                        onView={onView}
                        onEdit={onEdit}
                        onMarkPaid={onMarkPaid}
                        onDelete={onDelete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-md-none d-flex flex-column gap-3 p-3">
            {payrollPeriods.map((item) => (
              <article key={item.id} className="mcj-ui-mobile-card">
                <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="fw-semibold text-break">
                      {getHelperName(item)}
                    </div>
                    <div className="small text-muted">
                      {formatDate(item.period_start)} -{" "}
                      {formatDate(item.period_end)}
                    </div>
                  </div>
                  <PayrollActions
                    item={item}
                    onView={onView}
                    onEdit={onEdit}
                    onMarkPaid={onMarkPaid}
                    onDelete={onDelete}
                  />
                </div>
                <div className="mb-3">
                  <span className={getStatusBadgeClass(item.status)}>
                    {item.status || "-"}
                  </span>
                </div>
                <div className="row g-3 small">
                  <div className="col-6">
                    <div className="text-muted">Pay Date</div>
                    <div>{formatDate(item.pay_date)}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted">Total Pay</div>
                    <div className="fw-semibold">
                      {formatCurrency(item.total_amount)}
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted">Work Hours</div>
                    <div>{formatHoursFromMinutes(item.total_work_minutes)}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted">Travel Hours</div>
                    <div>
                      {formatHoursFromMinutes(item.total_travel_minutes)}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default HelperPayrollPeriodsTable;
