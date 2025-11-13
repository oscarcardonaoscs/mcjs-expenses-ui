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
      CHECK: "Check",
      BANK: "Bank",
      OTHER: "Other",
    };
    return map[code] || code;
  };

  // Intenta detectar el campo de últimos 4 dígitos que venga del backend
  const getLast4 = (e) =>
    e.payment_account_last4 ||
    e.payment_last4 ||
    e.last4 ||
    (e.payment_account && e.payment_account.last4) ||
    null;

  return (
    <div className="table-responsive">
      <table className="table table-striped table-sm align-middle w-100">
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Type</th>
            <th>Vendor</th>
            <th className="text-end">Total</th>
            <th>Payment</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e) => {
            const method = e.payment_method;
            const last4 = getLast4(e);
            const showLast4 = (method === "CARD" || method === "BANK") && last4;

            return (
              <tr key={e.id}>
                <td>{fmtDate(e.date)}</td>
                <td>{e.category?.name ?? "-"}</td>
                <td>{e.expense_type ?? "-"}</td>
                <td>{e.vendor?.name ?? "-"}</td>
                <td className="text-end">{fmtMoney.format(e.total ?? 0)}</td>
                <td>
                  <div>{prettyPayment(method)}</div>
                  {showLast4 && (
                    <div className="text-muted small">{`**${last4}`}</div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
