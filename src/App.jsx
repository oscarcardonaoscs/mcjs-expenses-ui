// src/App.jsx
import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

/** ============================
 *  Desktop sidebar (NavLink normal)
 *  ============================ */
function SidebarLinksDesktop() {
  const linkCls = ({ isActive }) =>
    "nav-link p-0" + (isActive ? " fw-semibold text-primary" : "");

  return (
    <nav className="nav flex-column gap-2">
      <NavLink className={linkCls} to="/" end>
        Dashboard
      </NavLink>
      <NavLink className={linkCls} to="/expenses">
        Expenses
      </NavLink>
      <NavLink className={linkCls} to="/categories">
        Categories
      </NavLink>
      <NavLink className={linkCls} to="/vendors">
        Vendors
      </NavLink>
      <NavLink className={linkCls} to="/payment-accounts">
        Payment Accounts
      </NavLink>
    </nav>
  );
}

/** ============================
 *  Mobile sidebar (Offcanvas)
 *  - NO navega directamente.
 *  - Coloca el destino en pendingRef y cierra con data-bs-dismiss.
 *  ============================ */
function SidebarLinksOffcanvas({ pendingRef }) {
  const location = useLocation();

  const linkCls = (to) =>
    "nav-link p-0" +
    (location.pathname === to ? " fw-semibold text-primary" : "");

  const makeHandler = (to) => (e) => {
    e.preventDefault(); // evitar navegación inmediata
    pendingRef.current = to; // guardar destino
    // El cierre lo hace Bootstrap por el data-attribute
  };

  return (
    <nav className="nav flex-column gap-2">
      <a
        href="/"
        className={linkCls("/")}
        data-bs-dismiss="offcanvas"
        onClick={makeHandler("/")}
      >
        Dashboard
      </a>
      <a
        href="/expenses"
        className={linkCls("/expenses")}
        data-bs-dismiss="offcanvas"
        onClick={makeHandler("/expenses")}
      >
        Expenses
      </a>
      <a
        href="/categories"
        className={linkCls("/categories")}
        data-bs-dismiss="offcanvas"
        onClick={makeHandler("/categories")}
      >
        Categories
      </a>
      <a
        href="/vendors"
        className={linkCls("/vendors")}
        data-bs-dismiss="offcanvas"
        onClick={makeHandler("/vendors")}
      >
        Vendors
      </a>
      <a
        href="/payment-accounts"
        className={linkCls("/payment-accounts")}
        data-bs-dismiss="offcanvas"
        onClick={makeHandler("/payment-accounts")}
      >
        Payment Accounts
      </a>
    </nav>
  );
}

/** ============================
 *  App principal
 *  ============================ */
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Aquí guardamos el destino al que se quiere navegar
  const pendingPathRef = useRef(null);

  // Escuchar CUANDO el offcanvas termina de cerrarse -> navegar
  useEffect(() => {
    const el = document.getElementById("appSidebar");
    if (!el) return;

    const onHidden = () => {
      const to = pendingPathRef.current;
      pendingPathRef.current = null;
      if (to) navigate(to);
    };

    el.addEventListener("hidden.bs.offcanvas", onHidden);
    return () => el.removeEventListener("hidden.bs.offcanvas", onHidden);
  }, [navigate]);

  // Cerrar offcanvas si cambias de ruta por otra vía y limpiar pending
  useEffect(() => {
    pendingPathRef.current = null;
    const el = document.getElementById("appSidebar");
    const inst = window.bootstrap?.Offcanvas?.getOrCreateInstance(el);
    inst?.hide();
  }, [location.pathname]);

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
          style={{
            top: 0,
            maxHeight: "calc(100vh - 56px)",
            overflowY: "auto",
          }}
        >
          <SidebarLinksDesktop />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-grow-1 d-flex flex-column">
        <header className="navbar bg-white border-bottom py-2 px-3 d-flex align-items-center gap-2">
          {/* Apertura con data-API de Bootstrap */}
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
          {/* Enlaces móviles: guardan destino y cierran; navegamos en "hidden" */}
          <SidebarLinksOffcanvas pendingRef={pendingPathRef} />
        </div>
      </div>
    </div>
  );
}
