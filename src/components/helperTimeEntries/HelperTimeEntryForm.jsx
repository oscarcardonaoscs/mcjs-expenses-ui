import { useEffect, useMemo, useState } from "react";
import { getClientLocations } from "../../services/clientLocationsService";

const defaultFormData = {
  helper_ids: [],
  work_date: "",
  client_id: "",
  location_id: "",
  start_time: "",
  end_time: "",
  notes: "",
};

function formatDuration(startTime, endTime) {
  if (!startTime || !endTime) {
    return "";
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return "";
  }

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  if (endTotalMinutes <= startTotalMinutes) {
    return "";
  }

  const diff = endTotalMinutes - startTotalMinutes;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

function calculateWorkMinutes(startTime, endTime) {
  if (!startTime || !endTime) {
    return null;
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return null;
  }

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  if (endTotalMinutes <= startTotalMinutes) {
    return null;
  }

  return endTotalMinutes - startTotalMinutes;
}

function getHelperFullName(helper) {
  return [helper.first_name, helper.last_name].filter(Boolean).join(" ");
}

function SearchableClientSelect({
  clients = [],
  value,
  onChange,
  disabled = false,
}) {
  const selectedClient = useMemo(
    () => clients.find((client) => String(client.id) === String(value)) || null,
    [clients, value],
  );

  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (selectedClient) {
      setSearch(selectedClient.name || "");
    } else if (!value) {
      setSearch("");
    }
  }, [selectedClient, value]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return clients.slice(0, 25);
    }

    return clients
      .filter((client) => client.name?.toLowerCase().includes(term))
      .slice(0, 25);
  }, [clients, search]);

  const handleSelectClient = (client) => {
    onChange(client.id);
    setSearch(client.name || "");
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setSearch("");
    setIsOpen(false);
  };

  return (
    <div className="position-relative">
      <div className="input-group">
        <input
          id="client_id"
          type="text"
          className="form-control"
          value={search}
          disabled={disabled}
          placeholder="Search client..."
          autoComplete="off"
          onChange={(e) => {
            setSearch(e.target.value);

            /*
             * Al escribir nuevamente, limpiamos el cliente
             * seleccionado y, por consecuencia, su location.
             */
            onChange("");

            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            setTimeout(() => {
              setIsOpen(false);

              if (selectedClient) {
                setSearch(selectedClient.name || "");
              } else if (!value) {
                setSearch("");
              }
            }, 150);
          }}
        />

        {value ? (
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleClear}
            disabled={disabled}
          >
            Clear
          </button>
        ) : null}
      </div>

      {isOpen && !disabled ? (
        <div
          className="list-group position-absolute w-100 shadow-sm"
          style={{
            zIndex: 1050,
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <button
                key={client.id}
                type="button"
                className="list-group-item list-group-item-action"
                onMouseDown={() => handleSelectClient(client)}
              >
                {client.name}
              </button>
            ))
          ) : (
            <div className="list-group-item text-muted">No clients found</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function HelperCheckboxList({
  helpers = [],
  selectedHelperIds = [],
  onChange,
  disabled = false,
}) {
  const activeHelpers = useMemo(() => {
    return helpers
      .filter((helper) => helper.is_active !== false && helper.is_active !== 0)
      .sort((a, b) => {
        const nameA = getHelperFullName(a).toLowerCase();
        const nameB = getHelperFullName(b).toLowerCase();

        return nameA.localeCompare(nameB);
      });
  }, [helpers]);

  const selectedSet = useMemo(
    () => new Set(selectedHelperIds.map((id) => String(id))),
    [selectedHelperIds],
  );

  const handleToggleHelper = (helperId) => {
    const helperIdString = String(helperId);

    if (selectedSet.has(helperIdString)) {
      onChange(selectedHelperIds.filter((id) => String(id) !== helperIdString));

      return;
    }

    onChange([...selectedHelperIds, helperIdString]);
  };

  if (activeHelpers.length === 0) {
    return (
      <div className="alert alert-warning mb-0" role="alert">
        No active helpers found.
      </div>
    );
  }

  return (
    <div className="border rounded p-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-semibold">Active Helpers</span>

        <span className="badge bg-primary">
          {selectedHelperIds.length} selected
        </span>
      </div>

      <div className="row g-2">
        {activeHelpers.map((helper) => {
          const helperId = String(helper.id);

          const helperName =
            getHelperFullName(helper) || `Helper #${helper.id}`;

          const inputId = `helper_${helper.id}`;

          return (
            <div key={helper.id} className="col-12 col-md-6 col-lg-4">
              <div className="form-check border rounded px-3 py-2 h-100">
                <input
                  id={inputId}
                  type="checkbox"
                  className="form-check-input ms-0 me-2"
                  checked={selectedSet.has(helperId)}
                  disabled={disabled}
                  onChange={() => handleToggleHelper(helperId)}
                />

                <label
                  htmlFor={inputId}
                  className="form-check-label ms-2 w-100"
                  style={{
                    cursor: disabled ? "default" : "pointer",
                  }}
                >
                  <div className="fw-semibold">{helperName}</div>

                  {helper.default_work_rate ? (
                    <small className="text-muted">
                      Work rate: ${helper.default_work_rate}
                    </small>
                  ) : null}
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HelperTimeEntryForm({
  helpers = [],
  clients = [],
  initialData = null,
  loading = false,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState(defaultFormData);

  const [locations, setLocations] = useState([]);

  const [locationsLoading, setLocationsLoading] = useState(false);

  const [locationLoadError, setLocationLoadError] = useState("");

  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // Inicializar formulario
  // ---------------------------------------------------------
  useEffect(() => {
    if (initialData) {
      const initialHelpers = Array.isArray(initialData.helpers)
        ? initialData.helpers
        : Array.isArray(initialData.time_entries)
          ? initialData.time_entries
          : [];

      const initialHelperIds =
        initialHelpers.length > 0
          ? initialHelpers
              .map((item) => item.helper_id)
              .filter(Boolean)
              .map(String)
          : initialData.helper_id
            ? [String(initialData.helper_id)]
            : [];

      setFormData({
        helper_ids: initialHelperIds,
        work_date: initialData.work_date ?? "",
        client_id: initialData.client_id ?? "",

        /*
         * Los registros históricos pueden tener
         * location_id = null.
         */
        location_id:
          initialData.location_id != null
            ? String(initialData.location_id)
            : "",

        start_time: initialData.start_time ?? "",
        end_time: initialData.end_time ?? "",
        notes: initialData.notes ?? "",
      });
    } else {
      setFormData({
        ...defaultFormData,
        helper_ids: [],
      });
    }

    setLocations([]);
    setLocationLoadError("");
    setError("");
  }, [initialData]);

  // ---------------------------------------------------------
  // Cargar locations cada vez que cambia el Client
  // ---------------------------------------------------------
  useEffect(() => {
    const clientId = formData.client_id;

    if (!clientId) {
      setLocations([]);
      setLocationLoadError("");
      setLocationsLoading(false);

      return;
    }

    let cancelled = false;

    const loadClientLocations = async () => {
      try {
        setLocationsLoading(true);
        setLocationLoadError("");

        const data = await getClientLocations(clientId);

        if (cancelled) {
          return;
        }

        /*
         * Soporta ambos formatos:
         *
         * [...]
         *
         * o:
         *
         * {
         *   items: [...]
         * }
         */
        const locationItems = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : [];

        const activeLocations = locationItems.filter(
          (location) =>
            location.is_active !== false && location.is_active !== 0,
        );

        setLocations(activeLocations);

        setFormData((prev) => {
          /*
           * Si el usuario cambió rápidamente de cliente
           * mientras cargábamos, no modificamos el state.
           */
          if (String(prev.client_id) !== String(clientId)) {
            return prev;
          }

          /*
           * Si ya existe una location seleccionada y
           * todavía es válida para este cliente,
           * la conservamos.
           */
          const currentLocationIsValid = activeLocations.some(
            (location) => String(location.id) === String(prev.location_id),
          );

          if (currentLocationIsValid) {
            return prev;
          }

          /*
           * Una sola location activa:
           * autoseleccionarla.
           */
          if (activeLocations.length === 1) {
            return {
              ...prev,
              location_id: String(activeLocations[0].id),
            };
          }

          /*
           * Cero o múltiples locations:
           * el usuario debe seleccionar.
           */
          return {
            ...prev,
            location_id: "",
          };
        });
      } catch (err) {
        if (cancelled) {
          return;
        }

        setLocations([]);

        setLocationLoadError(
          err?.message || "Failed to load client locations.",
        );

        setFormData((prev) => ({
          ...prev,
          location_id: "",
        }));
      } finally {
        if (!cancelled) {
          setLocationsLoading(false);
        }
      }
    };

    loadClientLocations();

    return () => {
      cancelled = true;
    };
  }, [formData.client_id]);

  const duration = useMemo(
    () => formatDuration(formData.start_time, formData.end_time),
    [formData.start_time, formData.end_time],
  );

  const workMinutes = useMemo(
    () => calculateWorkMinutes(formData.start_time, formData.end_time),
    [formData.start_time, formData.end_time],
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClientChange = (clientId) => {
    setFormData((prev) => ({
      ...prev,
      client_id: clientId,

      /*
       * Nunca conservar la location del cliente anterior.
       */
      location_id: "",
    }));

    setLocations([]);
    setLocationLoadError("");
  };

  const handleHelpersChange = (helperIds) => {
    setFormData((prev) => ({
      ...prev,
      helper_ids: helperIds,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.helper_ids.length) {
      setError("Please select at least one helper.");

      return;
    }

    if (!formData.work_date) {
      setError("Please select a work date.");

      return;
    }

    if (!formData.client_id) {
      setError("Please select a client.");

      return;
    }

    if (locationsLoading) {
      setError("Please wait while locations are loading.");

      return;
    }

    if (!formData.location_id) {
      setError("Please select a location.");

      return;
    }

    const hasStartTime = !!formData.start_time;
    const hasEndTime = !!formData.end_time;

    if (hasStartTime && !hasEndTime) {
      setError("End time is required when start time is provided.");

      return;
    }

    if (hasEndTime && !hasStartTime) {
      setError("Start time is required when end time is provided.");

      return;
    }

    if (
      hasStartTime &&
      hasEndTime &&
      formData.end_time <= formData.start_time
    ) {
      setError("End time must be later than start time.");

      return;
    }

    const payload = {
      work_date: formData.work_date,

      client_id: Number(formData.client_id),

      location_id: Number(formData.location_id),

      start_time: formData.start_time || null,

      end_time: formData.end_time || null,

      notes: formData.notes?.trim() || "",

      helpers: formData.helper_ids.map((helperId) => ({
        helper_id: Number(helperId),

        work_minutes: workMinutes,

        travel_minutes: 0,

        notes: "",
      })),
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to save time entry.",
      );
    }
  };

  const noActiveLocations =
    !!formData.client_id &&
    !locationsLoading &&
    !locationLoadError &&
    locations.length === 0;

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header py-3">
        <h6 className="m-0 fw-bold text-primary">
          {initialData ? "Edit Work Event" : "New Work Event"}
        </h6>
      </div>

      <div className="card-body">
        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Client */}
            <div className="col-12 col-md-6">
              <label htmlFor="client_id" className="form-label">
                Client
              </label>

              <SearchableClientSelect
                clients={clients}
                value={formData.client_id}
                onChange={handleClientChange}
                disabled={loading}
              />
            </div>

            {/* Location */}
            <div className="col-12 col-md-6">
              <label htmlFor="location_id" className="form-label">
                Location
              </label>

              <select
                id="location_id"
                name="location_id"
                className="form-select"
                value={formData.location_id}
                onChange={handleChange}
                disabled={
                  loading ||
                  locationsLoading ||
                  !formData.client_id ||
                  locations.length === 0
                }
              >
                <option value="">
                  {!formData.client_id
                    ? "Select a client first..."
                    : locationsLoading
                      ? "Loading locations..."
                      : locations.length === 0
                        ? "No active locations"
                        : locations.length === 1
                          ? locations[0].location_name
                          : "Select location..."}
                </option>

                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.location_name || `Location #${location.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Error cargando locations */}
            {locationLoadError ? (
              <div className="col-12">
                <div className="alert alert-danger mb-0" role="alert">
                  {locationLoadError}
                </div>
              </div>
            ) : null}

            {/* Cliente sin locations */}
            {noActiveLocations ? (
              <div className="col-12">
                <div className="alert alert-warning mb-0" role="alert">
                  This client does not have an active location. Add a location
                  before creating a work event.
                </div>
              </div>
            ) : null}

            {/* Work Date */}
            <div className="col-12 col-md-6">
              <label htmlFor="work_date" className="form-label">
                Work Date
              </label>

              <input
                id="work_date"
                type="date"
                name="work_date"
                className="form-control"
                value={formData.work_date}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Helpers */}
            <div className="col-12">
              <label className="form-label">Helpers</label>

              <HelperCheckboxList
                helpers={helpers}
                selectedHelperIds={formData.helper_ids}
                onChange={handleHelpersChange}
                disabled={loading}
              />
            </div>

            {/* Start Time */}
            <div className="col-12 col-md-6">
              <label htmlFor="start_time" className="form-label">
                Start Time
              </label>

              <input
                id="start_time"
                type="time"
                name="start_time"
                className="form-control"
                value={formData.start_time}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* End Time */}
            <div className="col-12 col-md-6">
              <label htmlFor="end_time" className="form-label">
                End Time
              </label>

              <input
                id="end_time"
                type="time"
                name="end_time"
                className="form-control"
                value={formData.end_time}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {(formData.start_time || formData.end_time) && (
              <div className="col-12">
                <div className="alert alert-light border mb-0" role="alert">
                  <strong>Duration:</strong> {duration || "-"}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="col-12">
              <label htmlFor="notes" className="form-label">
                Notes
              </label>

              <textarea
                id="notes"
                name="notes"
                className="form-control"
                rows="3"
                value={formData.notes}
                onChange={handleChange}
                disabled={loading}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || locationsLoading || noActiveLocations}
            >
              {loading
                ? "Saving..."
                : initialData
                  ? "Update Work Event"
                  : "Save Work Event"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HelperTimeEntryForm;
