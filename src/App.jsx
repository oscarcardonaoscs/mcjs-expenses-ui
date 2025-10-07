// src/App.jsx
import { NavLink, Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="min-vh-100 d-flex">
      <aside className="border-end" style={{ width: 240 }}>
        <div className="p-3 fw-bold">MCJ Expenses</div>
        <nav className="nav flex-column px-3 gap-2">
          {/* Usa "/" para Dashboard (o "/dashboard" si dejas esa ruta adicional) */}
          <NavLink className="nav-link p-0" to="/" end>
            Dashboard
          </NavLink>
          <NavLink className="nav-link p-0" to="/expenses">
            Expenses
          </NavLink>
          <NavLink className="nav-link p-0" to="/categories">
            Categories
          </NavLink>
          <NavLink className="nav-link p-0" to="/vendors">
            Vendors
          </NavLink>
        </nav>
      </aside>

      <main className="flex-grow-1">
        <div className="container py-4">
          {/* Aquí se pinta la página según la ruta */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
