export function ExpensesTable({ items = [] }) {
  return (
    <div className="table-responsive">
      <table className="table table-striped align-middle">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Categoría</th>
            <th>Proveedor</th>
            <th className="text-end">Monto</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <tr key={e.id}>
              <td>{e.date}</td>
              <td>{e.category?.name ?? "-"}</td>
              <td>{e.vendor?.name ?? "-"}</td>
              <td className="text-end">${Number(e.amount).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
