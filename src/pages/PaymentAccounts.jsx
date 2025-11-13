import { useMemo, useState } from "react";
import PaymentAccountForm from "@/components/PaymentAccountForm";
import {
  usePaymentAccounts,
  useCreatePaymentAccount,
  useUpdatePaymentAccount,
  useDeletePaymentAccount,
} from "@/api/hooks";

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
          a.name.localeCompare(b.name)
      ),
    [data]
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
    if (confirm(`Delete payment account "${row.name}"?`)) {
      await deleteMut.mutateAsync(row.id);
      if (selected?.id === row.id) cancel();
    }
  };

  return (
    <div className="px-0 mt-3">
      {/* Header alineado igual que las demás vistas */}
      <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-4">
        <h2 className="m-0">Payment Accounts</h2>
        {mode === "list" && (
          <button className="btn btn-success" onClick={startCreate}>
            New Account
          </button>
        )}
      </div>

      {isLoading && <div className="alert alert-info">Loading...</div>}
      {isError && (
        <div className="alert alert-danger">Error: {String(error)}</div>
      )}

      {mode === "list" && (
        <div className="table-responsive">
          <table className="table table-striped table-sm align-middle w-100">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>Name</th>
                {/* Ocultamos Type en pantallas muy pequeñas */}
                <th className="d-none d-sm-table-cell">Type</th>
                {/* Ocultamos Provider en pantallas pequeñas */}
                <th className="d-none d-md-table-cell">Provider</th>
                <th className="d-none d-sm-table-cell">Last4</th>
                <th>Status</th>
                <th className="text-end" style={{ width: 140 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, idx) => (
                <tr key={row.id}>
                  <td>{idx + 1}</td>
                  <td className="text-nowrap">{row.name}</td>

                  <td className="d-none d-sm-table-cell">
                    <span className="badge text-bg-secondary">{row.type}</span>
                  </td>

                  <td className="d-none d-md-table-cell">
                    {row.provider || <span className="text-muted">—</span>}
                  </td>

                  <td className="d-none d-sm-table-cell">
                    {row.last4 || <span className="text-muted">—</span>}
                  </td>

                  <td>
                    {row.is_active ? (
                      <span className="badge text-bg-success">Active</span>
                    ) : (
                      <span className="badge text-bg-secondary">Disabled</span>
                    )}
                  </td>

                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-primary"
                        onClick={() => startEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => onDelete(row)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {sorted.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="text-center text-muted">
                    No accounts yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {mode === "create" && (
        <div className="card">
          <div className="card-header">Create Account</div>
          <div className="card-body">
            <PaymentAccountForm
              onSubmit={onCreate}
              onCancel={cancel}
              loading={createMut.isPending}
            />
          </div>
        </div>
      )}

      {mode === "edit" && selected && (
        <div className="card">
          <div className="card-header">Edit Account</div>
          <div className="card-body">
            <PaymentAccountForm
              initialValues={selected}
              onSubmit={onUpdate}
              onCancel={cancel}
              loading={updateMut.isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
}
