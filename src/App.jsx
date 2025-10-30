// src/App.jsx
import { NavLink, Outlet } from "react-router-dom";

function SidebarLinks({ onNavigate }) {
  const linkCls = ({ isActive }) =>
    "nav-link p-0" + (isActive ? " fw-semibold text-primary" : "");

  // Dejamos que React Router navegue y luego cerramos el offcanvas
  const handleClick = () => {
    if (!onNavigate) return;
    setTimeout(() => onNavigate(), 100); // pequeño delay para no interferir
  };

  return (
    <nav className="nav flex-column gap-2">
      <NavLink className={linkCls} to="/" end onClick={handleClick}>
        Dashboard
      </NavLink>
      <NavLink className={linkCls} to="/expenses" onClick={handleClick}>
        Expenses
      </NavLink>
      <NavLink className={linkCls} to="/categories" onClick={handleClick}>
        Categories
      </NavLink>
      <NavLink className={linkCls} to="/vendors" onClick={handleClick}>
        Vendors
      </NavLink>
      <NavLink className={linkCls} to="/payment-accounts" onClick={handleClick}>
        Payment Accounts
      </NavLink>
    </nav>
  );
}

export default function App() {
  const closeOffcanvas = () => {
    const el = document.getElementById("appSidebar");
    if (!el) return;
    const inst = window.bootstrap?.Offcanvas?.getOrCreateInstance(el);
    inst?.hide();
  };

  return (
    <div className="min-vh-100 d-flex">
      {/* Aside fijo (>= md) */}
      <aside
        className="border-end d-none d-md-flex flex-column"
        style={{ width: 240 }}
      >
        <div className="p-3 fw-bold border-bottom">MCJ's Expenses</div>
        <div
          className="px-3 pt-3 position-sticky"
          style={{ top: 0, maxHeight: "calc(100vh - 56px)", overflowY: "auto" }}
        >
          <SidebarLinks />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-grow-1 d-flex flex-column">
        <header className="navbar bg-white border-bottom py-2 px-3 d-flex align-items-center gap-2">
          <button
            className="navbar-toggler d-md-none"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#appSidebar"
            aria-controls="appSidebar"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="fw-bold">MCJ's Expenses</div>
        </header>

        <div className="container-fluid py-4 flex-grow-1">
          <Outlet />
        </div>
      </main>

      {/* Offcanvas móvil */}
      <div
        className="offcanvas offcanvas-start d-md-none"
        tabIndex="-1"
        id="appSidebar"
        aria-labelledby="appSidebarLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="appSidebarLabel">
            MCJ's Expenses
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="offcanvas-body">
          {/* Usamos el cierre programado, sin data-bs-dismiss en los links */}
          <SidebarLinks onNavigate={closeOffcanvas} />
        </div>
      </div>
    </div>
  );
}
