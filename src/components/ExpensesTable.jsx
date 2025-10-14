export function ExpensesTable({ items = [] }) {
  const fmtMoney = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const fmtDate = (iso = "") => {
    // iso llega como "YYYY-MM-DD"
    const [y, m, d] = (iso || "").split("-");
    if (!y || !m || !d) return iso || "-";
    return `${m}/${d}/${y}`; // MM/DD/YYYY
  };

  const prettyPayment = (code) => {
    if (!code) return "-";
    const map = {
      CASH: "Cash",
      CARD: "Card",
      ZELLE: "Zelle",
      VENMO: "Venmo",
      CASHAPP: "Cash App",
      OTHER: "Other",
    };
    return map[code] || code;
  };

  return (
    <div className="table-responsive">
      <table className="table table-striped align-middle">
        <thead>
          <tr>
            <th>Date</th>
            <th>Expense Type</th>
            <th className="text-end">Total</th>
            <th>Payment Method</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <tr key={e.id}>
              <td>{fmtDate(e.date)}</td>
              <td>{e.expense_type ?? "-"}</td>
              <td className="text-end">{fmtMoney.format(e.total ?? 0)}</td>
              <td>{prettyPayment(e.payment_method)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
