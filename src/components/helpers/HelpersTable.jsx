import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function getHelperName(helper) {
  return [helper.first_name, helper.last_name].filter(Boolean).join(" ");
}

function MenuIcon() {
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

function HelperStatus({ active }) {
  return (
    <span
      className={`mcj-ui-badge ${active ? "mcj-ui-badge--success" : "mcj-ui-badge--neutral"}`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function HelperActions({ helper, onEdit, onDelete, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

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
      const menuWidth = 180;
      const menuHeight = 94;
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
    callback?.(helper);
  };

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        className="mcj-ui-action-trigger"
        disabled={disabled}
        onClick={toggleMenu}
        aria-label={`Actions for ${getHelperName(helper)}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Helper actions"
      >
        <MenuIcon />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Actions for ${getHelperName(helper)}`}
            className="mcj-ui-action-menu"
            style={{ top: position.top, left: position.left, width: 180 }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => execute(onEdit)}
            >
              Edit helper
            </button>
            <button
              type="button"
              role="menuitem"
              className="mcj-ui-danger"
              onClick={() => execute(onDelete)}
            >
              Delete helper
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

function HelpersTable({ helpers = [], onEdit, onDelete, loading = false }) {
  if (loading) {
    return (
      <section className="mcj-ui-panel p-4" role="status">
        Loading helpers...
      </section>
    );
  }

  return (
    <section className="mcj-ui-table-shell" aria-label="Helpers list">
      <div className="d-flex justify-content-between align-items-center px-3 py-3 border-bottom">
        <div>
          <h2 className="fw-semibold fs-6 mb-1">Helpers List</h2>
          <span className="small text-muted">
            {helpers.length} {helpers.length === 1 ? "helper" : "helpers"}
          </span>
        </div>
      </div>

      {helpers.length === 0 ? (
        <div className="text-center text-muted small p-4">
          No helpers found.
        </div>
      ) : (
        <>
          <div className="d-none d-md-block mcj-ui-table-scroll">
            <table className="mcj-ui-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Email</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-center" style={{ width: 64 }}>
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {helpers.map((helper) => (
                  <tr key={helper.id}>
                    <td className="fw-semibold">{getHelperName(helper)}</td>
                    <td>{helper.phone || "—"}</td>
                    <td className="text-break">{helper.email || "—"}</td>
                    <td>
                      <HelperStatus active={helper.is_active} />
                    </td>
                    <td className="text-center">
                      <HelperActions
                        helper={helper}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        disabled={loading}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-md-none p-3 d-flex flex-column gap-3">
            {helpers.map((helper) => (
              <article key={helper.id} className="mcj-ui-mobile-card">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="fw-semibold text-break">
                      {getHelperName(helper)}
                    </div>
                    <div className="small text-muted mt-1">
                      {helper.phone || "—"}
                    </div>
                  </div>
                  <HelperActions
                    helper={helper}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    disabled={loading}
                  />
                </div>
                <div className="small text-muted text-break mt-2">
                  {helper.email || "—"}
                </div>
                <div className="mt-3">
                  <HelperStatus active={helper.is_active} />
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default HelpersTable;
