import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  createClientLocation,
  getClientLocations,
  updateClientLocation,
} from "../services/clientLocationsService";

const emptyForm = {
  location_name: "",
  street_line1: "",
  street_line2: "",
  city: "",
  state: "AL",
  postal_code: "",
  country: "USA",
  square_feet: "",
  bedrooms: "",
  bathrooms: "",
  access_notes: "",
  service_notes: "",
  is_primary: false,
  is_active: true,
};

function normalizeForm(location) {
  return {
    location_name: location?.location_name ?? "",
    street_line1: location?.street_line1 ?? "",
    street_line2: location?.street_line2 ?? "",
    city: location?.city ?? "",
    state: location?.state ?? "AL",
    postal_code: location?.postal_code ?? "",
    country: location?.country ?? "USA",
    square_feet: location?.square_feet ?? "",
    bedrooms: location?.bedrooms ?? "",
    bathrooms: location?.bathrooms ?? "",
    access_notes: location?.access_notes ?? "",
    service_notes: location?.service_notes ?? "",
    is_primary: Boolean(location?.is_primary),
    is_active: location?.is_active ?? true,
  };
}

function emptyToNull(value) {
  if (value === "") {
    return null;
  }

  return value;
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

function buildPayload(form) {
  return {
    location_name: form.location_name.trim(),
    street_line1: emptyToNull(form.street_line1.trim()),
    street_line2: emptyToNull(form.street_line2.trim()),
    city: emptyToNull(form.city.trim()),
    state: emptyToNull(form.state.trim()),
    postal_code: emptyToNull(form.postal_code.trim()),
    country: emptyToNull(form.country.trim()),
    square_feet: numberOrNull(form.square_feet),
    bedrooms: numberOrNull(form.bedrooms),
    bathrooms: numberOrNull(form.bathrooms),
    access_notes: emptyToNull(form.access_notes.trim()),
    service_notes: emptyToNull(form.service_notes.trim()),
    is_primary: form.is_primary,
    is_active: form.is_active,
  };
}

function ClientLocationFormPage() {
  const navigate = useNavigate();
  const { clientId, locationId } = useParams();
  const routerLocation = useLocation();

  const client = routerLocation.state?.client || null;
  const locationFromState = routerLocation.state?.location || null;

  const isEdit = Boolean(locationId);

  const [form, setForm] = useState(
    locationFromState ? normalizeForm(locationFromState) : emptyForm,
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const clientName = useMemo(() => {
    return client?.name || `Client #${clientId}`;
  }, [client, clientId]);

  useEffect(() => {
    if (!isEdit || locationFromState) {
      return;
    }

    loadLocationForEdit();
  }, [isEdit, locationId]);

  const loadLocationForEdit = async () => {
    try {
      setLoading(true);
      setError("");

      const locations = await getClientLocations(clientId);
      const foundLocation = Array.isArray(locations)
        ? locations.find((item) => String(item.id) === String(locationId))
        : null;

      if (!foundLocation) {
        setError("Location not found.");
        return;
      }

      setForm(normalizeForm(foundLocation));
    } catch (err) {
      setError(err.message || "Failed to load location.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/clients/${clientId}/locations`, {
      state: { client },
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.location_name.trim()) {
      setError("Location name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = buildPayload(form);

      if (isEdit) {
        await updateClientLocation(locationId, payload);
      } else {
        await createClientLocation(clientId, payload);
      }

      navigate(`/clients/${clientId}/locations`, {
        state: { client },
      });
    } catch (err) {
      setError(err.message || "Failed to save location.");
    } finally {
      setSaving(false);
    }
  };

  const disabled = loading || saving;

  return (
    <div className="container-fluid">
      <div className="mb-4">
        <div className="small mb-2">
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none"
            onClick={() => navigate("/clients")}
            disabled={disabled}
          >
            Clients
          </button>

          <span className="text-muted"> / </span>

          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none"
            onClick={handleBack}
            disabled={disabled}
          >
            Locations
          </button>

          <span className="text-muted"> / </span>

          <span className="text-muted">
            {isEdit ? "Edit Location" : "Add Location"}
          </span>
        </div>

        <h1 className="h3 mb-1 text-gray-800">
          {isEdit ? "Edit Location" : "Add Location"}
        </h1>

        <p className="mb-0 text-muted">
          {isEdit
            ? `Update location information for ${clientName}.`
            : `Create a new service location for ${clientName}.`}
        </p>
      </div>

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

      <div className="card shadow mb-4">
        <div className="card-body">
          {loading ? (
            <div>Loading location...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="location_name">
                    Location Name
                  </label>
                  <input
                    id="location_name"
                    name="location_name"
                    type="text"
                    className="form-control"
                    value={form.location_name}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder="Main House"
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="street_line1">
                    Street 1
                  </label>
                  <input
                    id="street_line1"
                    name="street_line1"
                    type="text"
                    className="form-control"
                    value={form.street_line1}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder="123 Example St"
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="street_line2">
                    Street 2
                  </label>
                  <input
                    id="street_line2"
                    name="street_line2"
                    type="text"
                    className="form-control"
                    value={form.street_line2}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder="Apt, Suite, Unit..."
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="city">
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    className="form-control"
                    value={form.city}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder="Madison"
                  />
                </div>

                <div className="col-6 col-md-2">
                  <label className="form-label" htmlFor="state">
                    State
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    className="form-control"
                    value={form.state}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder="AL"
                  />
                </div>

                <div className="col-6 col-md-2">
                  <label className="form-label" htmlFor="postal_code">
                    Postal Code
                  </label>
                  <input
                    id="postal_code"
                    name="postal_code"
                    type="text"
                    className="form-control"
                    value={form.postal_code}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder="35758"
                  />
                </div>

                <div className="col-12 col-md-2">
                  <label className="form-label" htmlFor="country">
                    Country
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    className="form-control"
                    value={form.country}
                    onChange={handleChange}
                    disabled={disabled}
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="square_feet">
                    Square Feet
                  </label>
                  <input
                    id="square_feet"
                    name="square_feet"
                    type="number"
                    className="form-control"
                    value={form.square_feet}
                    onChange={handleChange}
                    disabled={disabled}
                    min="0"
                    step="1"
                    placeholder="2100"
                  />
                </div>

                <div className="col-6 col-md-4">
                  <label className="form-label" htmlFor="bedrooms">
                    Bedrooms
                  </label>
                  <input
                    id="bedrooms"
                    name="bedrooms"
                    type="number"
                    className="form-control"
                    value={form.bedrooms}
                    onChange={handleChange}
                    disabled={disabled}
                    min="0"
                    step="0.5"
                    placeholder="3"
                  />
                </div>

                <div className="col-6 col-md-4">
                  <label className="form-label" htmlFor="bathrooms">
                    Bathrooms
                  </label>
                  <input
                    id="bathrooms"
                    name="bathrooms"
                    type="number"
                    className="form-control"
                    value={form.bathrooms}
                    onChange={handleChange}
                    disabled={disabled}
                    min="0"
                    step="0.5"
                    placeholder="2.5"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label" htmlFor="access_notes">
                    Access Notes
                  </label>
                  <textarea
                    id="access_notes"
                    name="access_notes"
                    className="form-control"
                    value={form.access_notes}
                    onChange={handleChange}
                    disabled={disabled}
                    rows="3"
                    placeholder="Gate code, lockbox, parking instructions..."
                  />
                </div>

                <div className="col-12">
                  <label className="form-label" htmlFor="service_notes">
                    Service Notes
                  </label>
                  <textarea
                    id="service_notes"
                    name="service_notes"
                    className="form-control"
                    value={form.service_notes}
                    onChange={handleChange}
                    disabled={disabled}
                    rows="3"
                    placeholder="Hardwood notes, pets, rooms to skip..."
                  />
                </div>

                <div className="col-12">
                  <div className="form-check form-switch mb-2">
                    <input
                      id="is_primary"
                      name="is_primary"
                      type="checkbox"
                      className="form-check-input"
                      checked={form.is_primary}
                      onChange={handleChange}
                      disabled={disabled}
                    />
                    <label className="form-check-label" htmlFor="is_primary">
                      Primary location
                    </label>
                  </div>

                  <div className="form-check form-switch">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      className="form-check-input"
                      checked={form.is_active}
                      onChange={handleChange}
                      disabled={disabled}
                    />
                    <label className="form-check-label" htmlFor="is_active">
                      Active
                    </label>
                  </div>
                </div>
              </div>

              <div className="d-flex flex-column flex-md-row justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleBack}
                  disabled={disabled}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={disabled}
                >
                  {saving
                    ? "Saving..."
                    : isEdit
                      ? "Save Changes"
                      : "Create Location"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientLocationFormPage;
