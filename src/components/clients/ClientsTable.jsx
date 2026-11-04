import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./ClientsTable.css";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function getLocationsCount(client) {
  if (typeof client.locations_count === "number") return client.locations_count;
  if (typeof client.locationsCount === "number") return client.locationsCount;
  if (Array.isArray(client.locations)) return client.locations.length;
  return 0;
}

function formatLocationsLabel(count) {
  return count === 1 ? "1 location" : `${count} locations`;
}

function MenuIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function ClientActions({ client, onEdit, onLocations, onDelete }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => {
      if (
        !buttonRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const closeOnScroll = () => setOpen(false);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", closeOnScroll);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", closeOnScroll);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [open]);

  const toggleMenu = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 180;
      const menuHeight = 136;
      setPosition({
        top:
          rect.bottom + menuHeight + 8 > window.innerHeight
            ? Math.max(8, rect.top - menuHeight - 4)
            : rect.bottom + 4,
        left: Math.max(
          8,
          Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
        ),
      });
    }
    setOpen((previous) => !previous);
  };

  const action = (callback) => {
    setOpen(false);
    callback?.(client);
  };

  return (
    <>
      <button
        type="button"
        className="mcj-client-action-trigger"
        ref={buttonRef}
        aria-label={`Actions for ${client.name || "client"}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleMenu}
      >
        <MenuIcon />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="mcj-client-action-menu"
            role="menu"
            aria-label={`Actions for ${client.name || "client"}`}
            style={{ top: position.top, left: position.left }}
          >
            {onEdit && (
              <button
                type="button"
                role="menuitem"
                onClick={() => action(onEdit)}
              >
                Edit client
              </button>
            )}
            {onLocations && (
              <button
                type="button"
                role="menuitem"
                onClick={() => action(onLocations)}
              >
                View locations
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                role="menuitem"
                className="mcj-client-delete"
                onClick={() => action(onDelete)}
              >
                Delete client
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

export default function ClientsTable({
  clients = [],
  loading = false,
  onEdit,
  onLocations,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="mcj-clients-table-shell mcj-clients-empty" role="status">
        Loading clients...
      </div>
    );
  }
  if (!clients.length) {
    return (
      <div className="mcj-clients-table-shell mcj-clients-empty">
        No clients found.
      </div>
    );
  }

  return (
    <div className="mcj-clients-table-root">
      <div className="mcj-clients-table-shell d-none d-md-block">
        <div className="mcj-clients-table-scroll">
          <table className="mcj-clients-table">
            <thead>
              <tr>
                <th scope="col" className="mcj-client-index">
                  #
                </th>
                <th scope="col">Name</th>
                <th scope="col">Locations</th>
                <th scope="col">Status</th>
                <th scope="col">Updated</th>
                <th scope="col" className="mcj-client-actions-head">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, index) => {
                const count = getLocationsCount(client);
                const active = client.is_active;
                return (
                  <tr key={client.id ?? index}>
                    <td className="mcj-client-index">{index + 1}</td>
                    <td>
                      <div className="mcj-client-name">
                        {client.name || "Unnamed client"}
                      </div>
                      {client.email && (
                        <div className="mcj-client-secondary">
                          {client.email}
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        className="mcj-client-location-link"
                        type="button"
                        onClick={() => onLocations?.(client)}
                        disabled={!onLocations}
                      >
                        {formatLocationsLabel(count)}
                      </button>
                    </td>
                    <td>
                      <span
                        className={`mcj-client-status ${active ? "is-active" : "is-inactive"}`}
                      >
                        {active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="mcj-client-date">
                      {formatDate(client.updated_at)}
                    </td>
                    <td className="mcj-client-actions-cell">
                      <ClientActions
                        client={client}
                        onEdit={onEdit}
                        onLocations={onLocations}
                        onDelete={onDelete}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mcj-clients-mobile d-md-none">
        {clients.map((client, index) => {
          const count = getLocationsCount(client);
          const active = client.is_active;
          return (
            <article
              className="mcj-client-mobile-card"
              key={client.id ?? index}
            >
              <div className="mcj-client-mobile-top">
                <div className="mcj-client-mobile-identity">
                  <div className="mcj-client-name">
                    {client.name || "Unnamed client"}
                  </div>
                  {client.email && (
                    <div className="mcj-client-secondary">{client.email}</div>
                  )}
                </div>
                <ClientActions
                  client={client}
                  onEdit={onEdit}
                  onLocations={onLocations}
                  onDelete={onDelete}
                />
              </div>
              <div className="mcj-client-mobile-meta">
                <div>
                  <span>Locations</span>
                  <button
                    type="button"
                    className="mcj-client-location-link"
                    onClick={() => onLocations?.(client)}
                    disabled={!onLocations}
                  >
                    {formatLocationsLabel(count)}
                  </button>
                </div>
                <div>
                  <span>Status</span>
                  <span
                    className={`mcj-client-status ${active ? "is-active" : "is-inactive"}`}
                  >
                    {active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div>
                  <span>Updated</span>
                  <strong>{formatDate(client.updated_at)}</strong>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
