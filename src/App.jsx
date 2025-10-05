import { Outlet, Link, NavLink } from "react-router-dom";

export default function App() {
  return (
    <div className="min-h-screen flex">
      <aside style={{ padding: 16, width: 240, borderRight: "1px solid #eee" }}>
        <h2>MCJ Expenses</h2>
        <nav style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/expenses">Expenses</NavLink>
          <NavLink to="/categories">Categories</NavLink>
          <NavLink to="/vendors">Vendors</NavLink>
        </nav>
      </aside>
      <main style={{ padding: 24, flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
