// src/App.jsx
import { NavLink, Outlet } from "react-router-dom";

// Reutilizamos los mismos enlaces para el aside y el offcanvas
function SidebarLinks({ onNavigate }) {
  const linkCls = ({ isActive }) =>
    "nav-link p-0" + (isActive ? " fw-semibold text-primary" : "");
  const handleClick = () => onNavigate?.(); // cerrar offcanvas al navegar

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
    const offcanvas = window.bootstrap?.Offcanvas?.getInstance(el);
    offcanvas?.hide();
  };

  return (
    <div className="min-vh-100 d-flex">
      {/* Aside fijo (solo >= md) */}
      <aside
        className="border-end d-none d-md-flex flex-column"
        style={{ width: 240 }}
      >
        <div className="p-3 fw-bold border-bottom">MCJ Expenses</div>
        {/* Hacemos sticky dentro del viewport y con scroll propio */}
        <div
          className="px-3 pt-3 position-sticky"
          style={{ top: 0, maxHeight: "calc(100vh - 56px)", overflowY: "auto" }}
        >
          <SidebarLinks />
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-grow-1 d-flex flex-column">
        {/* Topbar con hamburguesa visible en < md */}
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
          <div className="fw-bold">MCJ Expenses</div>
        </header>

        {/* Contenedor fluido para aprovechar todo el ancho en escritorio */}
        <div className="container-fluid py-4 flex-grow-1">
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
