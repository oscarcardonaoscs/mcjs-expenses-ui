import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ClientLocationsTable from "../components/clients/ClientLocationsTable";
import {
  getClientLocations,
  deleteClientLocation,
} from "../services/clientLocationsService";

function ClientLocationsPage() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const routerLocation = useLocation();

  const clientFromState = routerLocation.state?.client || null;

  const [client] = useState(clientFromState);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const clientName = useMemo(() => {
    return client?.name || `Client #${clientId}`;
  }, [client, clientId]);

  useEffect(() => {
    loadLocations();
  }, [clientId]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getClientLocations(clientId);

      if (Array.isArray(data)) {
        setLocations(data);
      } else if (Array.isArray(data?.items)) {
        setLocations(data.items);
      } else {
        setLocations([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load locations.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/clients");
  };

  const handleAddLocation = () => {
    navigate(`/clients/${clientId}/locations/new`, {
      state: { client },
    });
  };

  const handleEditLocation = (location) => {
    navigate(`/clients/${clientId}/locations/${location.id}/edit`, {
      state: {
        client,
        location,
      },
    });
  };

  const handleDeleteLocation = async (location) => {
    const locationName = location.location_name || "this location";

    const confirmed = window.confirm(
      `Are you sure you want to delete "${locationName}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await deleteClientLocation(clientId, location.id);
      await loadLocations();
    } catch (err) {
      setError(err.message || "Failed to delete location.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="mb-4">
        <div className="small mb-2">
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none"
            onClick={handleBack}
            disabled={loading || actionLoading}
          >
            Clients
          </button>

          <span className="text-muted"> / </span>

          <span className="text-muted">Locations</span>
        </div>

        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <h1 className="h3 mb-1 text-gray-800">
              Locations for: {clientName}
            </h1>

            <p className="mb-0 text-muted">
              Manage the addresses/places where this client receives service.
            </p>
          </div>

          <div className="w-100 w-md-auto">
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={handleAddLocation}
              disabled={loading || actionLoading}
            >
              + Add Location
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

      <ClientLocationsTable
        locations={locations}
        loading={loading}
        onEdit={handleEditLocation}
        onDelete={handleDeleteLocation}
      />
    </div>
  );
}

export default ClientLocationsPage;
