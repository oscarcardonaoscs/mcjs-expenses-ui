import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PaymentAccountForm from "@/components/PaymentAccountForm";
import {
  usePaymentAccounts,
  useCreatePaymentAccount,
  useUpdatePaymentAccount,
  useDeletePaymentAccount,
} from "@/api/hooks";
import "../styles/mcj-ui.css";

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

function PaymentAccountActions({
  account,
  onEdit,
  onDelete,
  disabled = false,
}) {
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
      const menuWidth = 190;
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
    callback(account);
  };

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        className="mcj-ui-action-trigger"
        disabled={disabled}
        onClick={toggleMenu}
        aria-label={`Actions for ${account.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Payment account actions"
      >
        <MenuIcon />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Actions for ${account.name}`}
            className="mcj-ui-action-menu"
            style={{ top: position.top, left: position.left, width: 190 }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => execute(onEdit)}
            >
              Edit account
            </button>
            <button
              type="button"
              role="menuitem"
              className="mcj-ui-danger"
              onClick={() => execute(onDelete)}
            >
              Delete account
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

export default function PaymentAccounts() {
  const { data = [], isLoading, isError, error } = usePaymentAccounts();
  const createMut = useCreatePaymentAccount();
  const updateMut = useUpdatePaymentAccount();
  const deleteMut = useDeletePaymentAccount();

  const [mode, setMode] = useState("list"); // list | create | edit
  const [selected, setSelected] = useState(null);

  const sorted = useMemo(
    () =>
      [...data].sort(
        (a, b) =>
          Number(b.is_active) - Number(a.is_active) ||
          a.name.localeCompare(b.name),
      ),
    [data],
  );

  const startCreate = () => {
    setSelected(null);
    setMode("create");
  };
  const startEdit = (row) => {
    setSelected(row);
    setMode("edit");
  };
  const cancel = () => {
    setSelected(null);
    setMode("list");
  };

  const onCreate = async (payload) => {
    await createMut.mutateAsync(payload);
    cancel();
  };
  const onUpdate = async (payload) => {
    await updateMut.mutateAsync({ id: selected.id, payload });
    cancel();
  };
  const onDelete = async (row) => {
    if (window.confirm(`Delete payment account "${row.name}"?`)) {
      await deleteMut.mutateAsync(row.id);
      if (selected?.id === row.id) cancel();
    }
  };

  const deleting = deleteMut.isPending;

  return (
    <div className="w-100">
      <header className="mcj-page-header">
        <div>
          <h1 className="mcj-page-title">Payment Accounts</h1>
          <p className="mcj-page-subtitle">
            Manage the accounts and payment methods used for business expenses.
          </p>
        </div>
        {mode === "list" && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={startCreate}
          >
            <span aria-hidden="true" className="me-1">
              +
            </span>
            New Account
          </button>
        )}
      </header>

      {isLoading && (
        <div className="alert alert-info" role="status">
          Loading...
        </div>
      )}
      {isError && (
        <div className="alert alert-danger" role="alert">
          Error: {String(error)}
        </div>
      )}

      {mode === "list" && !isLoading && !isError && (
        <section className="mcj-ui-table-shell" aria-label="Payment accounts">
          <div className="d-flex align-items-center justify-content-between px-3 py-3 border-bottom">
            <div>
              <h2 className="fw-semibold fs-6 mb-1">Payment Accounts</h2>
              <span className="small text-muted">
                {sorted.length} {sorted.length === 1 ? "account" : "accounts"}
              </span>
            </div>
          </div>
          {sorted.length === 0 ? (
            <div className="text-center text-muted small p-4">
              No accounts yet.
            </div>
          ) : (
            <div className="mcj-ui-table-scroll">
              <table className="mcj-ui-table">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: 66 }}>
                      #
                    </th>
                    <th scope="col">Name</th>
                    <th scope="col" className="d-none d-sm-table-cell">
                      Type
                    </th>
                    <th scope="col" className="d-none d-md-table-cell">
                      Provider
                    </th>
                    <th scope="col" className="d-none d-sm-table-cell">
                      Last4
                    </th>
                    <th scope="col">Status</th>
                    <th scope="col" style={{ width: 64 }}>
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="mcj-ui-muted">{idx + 1}</td>
                      <td className="fw-semibold">{row.name}</td>
                      <td className="d-none d-sm-table-cell">
                        <span className="mcj-ui-badge mcj-ui-badge--neutral">
                          {row.type || "—"}
                        </span>
                      </td>
                      <td className="d-none d-md-table-cell">
                        {row.provider || (
                          <span className="mcj-ui-muted">—</span>
                        )}
                      </td>
                      <td className="d-none d-sm-table-cell">
                        {row.last4 || <span className="mcj-ui-muted">—</span>}
                      </td>
                      <td>
                        <span
                          className={`mcj-ui-badge ${row.is_active ? "mcj-ui-badge--success" : "mcj-ui-badge--neutral"}`}
                        >
                          {row.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="text-center">
                        <PaymentAccountActions
                          account={row}
                          onEdit={startEdit}
                          onDelete={onDelete}
                          disabled={deleting}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {mode === "create" && (
        <section className="mcj-ui-panel p-3 p-md-4">
          <h2 className="fw-semibold fs-6 mb-3">Create Account</h2>
          <PaymentAccountForm
            onSubmit={onCreate}
            onCancel={cancel}
            loading={createMut.isPending}
          />
        </section>
      )}

      {mode === "edit" && selected && (
        <section className="mcj-ui-panel p-3 p-md-4">
          <h2 className="fw-semibold fs-6 mb-3">Edit Account</h2>
          <PaymentAccountForm
            initialValues={selected}
            onSubmit={onUpdate}
            onCancel={cancel}
            loading={updateMut.isPending}
          />
        </section>
      )}
    </div>
  );
}
