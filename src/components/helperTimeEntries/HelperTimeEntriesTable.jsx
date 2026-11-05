import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../../styles/mcj-ui.css";

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-US");
}

function formatGroupDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(timeString) {
  if (!timeString) return "-";
  const parts = String(timeString).split(":");
  if (parts.length < 2) return timeString;
  const hours = Number(parts[0]);
  const minutes = parts[1];
  if (Number.isNaN(hours)) return timeString;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes} ${suffix}`;
}

function formatDuration(startTime, endTime) {
  if (!startTime || !endTime) return "-";
  const [startHour, startMinute] = String(startTime).split(":").map(Number);
  const [endHour, endMinute] = String(endTime).split(":").map(Number);
  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  )
    return "-";
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  if (endTotalMinutes <= startTotalMinutes) return "-";
  const diff = endTotalMinutes - startTotalMinutes;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function getHelperName(helperId, helpers) {
  const helper = helpers.find((item) => Number(item.id) === Number(helperId));
  if (!helper) return `Helper #${helperId}`;
  return [helper.first_name, helper.last_name].filter(Boolean).join(" ");
}

function getClientName(entry) {
  return entry.client_name || entry.client?.name || "-";
}

function groupEntriesByDate(entries) {
  const groups = {};
  entries.forEach((entry) => {
    const key = entry.work_date || "unknown";
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  });
  return Object.entries(groups).sort((a, b) => {
    if (a[0] < b[0]) return 1;
    if (a[0] > b[0]) return -1;
    return 0;
  });
}

function ActionIcon() {
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

function EntryActions({ entry, onEdit, onDelete, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (event) => {
      if (
        !triggerRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const close = () => setOpen(false);
    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const width = 180;
      const height = 94;
      setPosition({
        top:
          rect.bottom + height + 8 > window.innerHeight
            ? Math.max(8, rect.top - height - 4)
            : rect.bottom + 4,
        left: Math.max(
          8,
          Math.min(rect.right - width, window.innerWidth - width - 8),
        ),
      });
    }
    setOpen((current) => !current);
  };
  const choose = (fn) => {
    setOpen(false);
    fn?.(entry);
  };

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="mcj-ui-action-trigger"
        onClick={toggle}
        disabled={disabled}
        aria-label={`Actions for ${getClientName(entry)}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Time entry actions"
      >
        <ActionIcon />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="mcj-ui-action-menu"
            role="menu"
            aria-label="Time entry actions"
            style={{ top: position.top, left: position.left, minWidth: 180 }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => choose(onEdit)}
            >
              Edit time entry
            </button>
            <button
              type="button"
              role="menuitem"
              className="mcj-ui-danger"
              onClick={() => choose(onDelete)}
            >
              Delete time entry
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

function HelperTimeEntriesTable({
  entries = [],
  helpers = [],
  loading = false,
  onEdit,
  onDelete,
  actionsDisabled = false,
}) {
  const groupedEntries = groupEntriesByDate(entries);

  return (
    <section className="mcj-ui-table-shell" aria-label="Helper time entries">
      <div className="d-flex justify-content-between align-items-center gap-2 px-3 py-3 border-bottom">
        <div>
          <h2 className="fs-6 fw-semibold mb-1">Time Entries</h2>
          <span className="small text-muted">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-muted" role="status">
          Loading time entries...
        </div>
      ) : entries.length === 0 ? (
        <div className="p-4 text-muted">No time entries found.</div>
      ) : (
        <>
          <div className="d-none d-md-block mcj-ui-table-scroll">
            <table className="mcj-ui-table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: 56 }}>
                    #
                  </th>
                  <th scope="col">Work Date</th>
                  <th scope="col">Client</th>
                  <th scope="col">Helper</th>
                  <th scope="col">Start Time</th>
                  <th scope="col">End Time</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Notes</th>
                  <th scope="col" style={{ width: 64 }} className="text-center">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={entry.id}>
                    <td className="mcj-ui-muted">{index + 1}</td>
                    <td className="text-nowrap">
                      {formatDate(entry.work_date)}
                    </td>
                    <td className="fw-semibold">{getClientName(entry)}</td>
                    <td>{getHelperName(entry.helper_id, helpers)}</td>
                    <td className="text-nowrap">
                      {formatTime(entry.start_time)}
                    </td>
                    <td className="text-nowrap">
                      {formatTime(entry.end_time)}
                    </td>
                    <td className="text-nowrap">
                      {formatDuration(entry.start_time, entry.end_time)}
                    </td>
                    <td
                      className="text-break"
                      style={{ minWidth: 160, maxWidth: 340 }}
                    >
                      {entry.notes || "—"}
                    </td>
                    <td className="text-center">
                      <EntryActions
                        entry={entry}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        disabled={actionsDisabled}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-md-none p-3 d-flex flex-column gap-4">
            {groupedEntries.map(([dateKey, items]) => (
              <div key={dateKey}>
                <h3 className="small fw-semibold text-muted mb-2">
                  {formatGroupDate(dateKey)}
                </h3>
                <div className="d-flex flex-column gap-2">
                  {items.map((entry) => (
                    <article key={entry.id} className="mcj-ui-mobile-card">
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                        <div className="min-width-0">
                          <div className="fw-semibold text-break">
                            {getClientName(entry)}
                          </div>
                          <div className="small text-muted text-break">
                            {getHelperName(entry.helper_id, helpers)}
                          </div>
                        </div>
                        <EntryActions
                          entry={entry}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          disabled={actionsDisabled}
                        />
                      </div>
                      <div className="row g-3 small">
                        <div className="col-7">
                          <div className="text-muted mb-1">Schedule</div>
                          <div className="fw-semibold">
                            {formatTime(entry.start_time)} →{" "}
                            {formatTime(entry.end_time)}
                          </div>
                        </div>
                        <div className="col-5">
                          <div className="text-muted mb-1">Duration</div>
                          <div className="fw-semibold">
                            {formatDuration(entry.start_time, entry.end_time)}
                          </div>
                        </div>
                      </div>
                      {entry.notes && (
                        <div className="small mt-3 pt-3 border-top">
                          <div className="text-muted mb-1">Notes</div>
                          <div className="text-break">{entry.notes}</div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default HelperTimeEntriesTable;
