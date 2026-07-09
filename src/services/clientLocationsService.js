import API_BASE_URL from "./api";

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
  return request(`/clients/${clientId}/locations`);
}

export function createClientLocation(clientId, payload) {
  return request(`/clients/${clientId}/locations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateClientLocation(locationId, payload) {
  return request(`/clients/locations/${locationId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteClientLocation(locationId) {
  return request(`/clients/locations/${locationId}`, {
    method: "DELETE",
  });
}
