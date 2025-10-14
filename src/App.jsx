// src/App.jsx
import { NavLink, Outlet } from "react-router-dom";

// Reutilizamos los mismos enlaces para el aside y el offcanvas
function SidebarLinks({ onNavigate }) {
  const linkCls = ({ isActive }) =>
    "nav-link p-0" + (isActive ? " fw-semibold text-primary" : "");
  const handleClick = () => onNavigate?.(); // para cerrar el offcanvas al navegar

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
    </nav>
  );
}

export default function App() {
  // Cierra el offcanvas al seleccionar una ruta (en móvil)
  const closeOffcanvas = () => {
    const el = document.getElementById("appSidebar");
    if (!el) return;
    // Bootstrap 5 Offcanvas API
    const offcanvas = bootstrap?.Offcanvas?.getInstance(el);
    offcanvas?.hide();
  };

  return (
    <div className="min-vh-100 d-flex">
      {/* Aside fijo solo en >= md */}
      <aside className="border-end d-none d-md-block" style={{ width: 240 }}>
        <div className="p-3 fw-bold">MCJ Expenses</div>
        <div className="px-3">
          <SidebarLinks />
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-grow-1 d-flex flex-column">
        {/* Topbar con hamburguesa visible en < md */}
        <header className="navbar navbar-light bg-white border-bottom py-2 px-3 d-flex align-items-center gap-2">
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
          <div className="fw-bold">MCJ Expenses</div>
        </header>

        <div className="container py-4 flex-grow-1">
          <Outlet />
        </div>
      </main>

      {/* Offcanvas: menú lateral para móvil */}
      <div
        className="offcanvas offcanvas-start d-md-none"
        tabIndex="-1"
        id="appSidebar"
        aria-labelledby="appSidebarLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="appSidebarLabel">
            MCJ Expenses
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="offcanvas-body">
          <SidebarLinks onNavigate={closeOffcanvas} />
        </div>
      </div>
    </div>
  );
}
