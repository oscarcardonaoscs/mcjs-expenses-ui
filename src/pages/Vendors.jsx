import { useMemo, useState } from "react";
import VendorForm from "../components/VendorForm";
import {
  useVendors,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
} from "../features/vendors/api";

export default function Vendors() {
  const { data = [], isLoading, isError, error } = useVendors();
  const createMut = useCreateVendor();
  const updateMut = useUpdateVendor();
  const deleteMut = useDeleteVendor();

  const [mode, setMode] = useState("list"); // list | create | edit
  const [selected, setSelected] = useState(null);

  const sorted = useMemo(
    () => [...data].sort((a, b) => a.name.localeCompare(b.name)),
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
    await updateMut.mutateAsync({ id: selected.id, ...payload });
    cancel();
  };
  const onDelete = async (row) => {
    if (confirm(`Delete vendor "${row.name}"?`)) {
      await deleteMut.mutateAsync(row.id);
    }
  };

  return (
    <div className="container py-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="m-0">Vendors</h2>
        {mode === "list" && (
          <button className="btn btn-success" onClick={startCreate}>
            New Vendor
          </button>
        )}
      </div>

      {isLoading && <div className="alert alert-info">Loading...</div>}
      {isError && (
        <div className="alert alert-danger">Error: {String(error)}</div>
      )}

      {mode === "list" && (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Name</th>
                <th style={{ width: 160 }}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, idx) => (
                <tr key={row.id}>
                  <td>{idx + 1}</td>
                  <td>{row.name}</td>
                  <td className="text-end">
                    <div className="btn-group">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => startEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
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
                  <td colSpan={3} className="text-center text-muted">
                    No vendors yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {mode === "create" && (
        <div className="card">
          <div className="card-header">Create Vendor</div>
          <div className="card-body">
            <VendorForm
              onSubmit={onCreate}
              onCancel={cancel}
              loading={createMut.isPending}
            />
          </div>
        </div>
      )}

      {mode === "edit" && selected && (
        <div className="card">
          <div className="card-header">Edit Vendor</div>
          <div className="card-body">
            <VendorForm
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
