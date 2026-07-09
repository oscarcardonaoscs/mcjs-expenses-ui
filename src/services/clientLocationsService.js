const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = "Request failed.";

    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      // Keep default message
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function getClientLocations(clientId) {
  return request(`/v1/clients/${clientId}/locations`);
}

export function createClientLocation(clientId, payload) {
  return request(`/v1/clients/${clientId}/locations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateClientLocation(locationId, payload) {
  return request(`/v1/clients/locations/${locationId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteClientLocation(locationId) {
  return request(`/v1/clients/locations/${locationId}`, {
    method: "DELETE",
  });
}
