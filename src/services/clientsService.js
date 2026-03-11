import API_BASE_URL from "./api";

const CLIENTS_URL = `${API_BASE_URL}/clients`;

async function handleResponse(response) {
  if (!response.ok) {
    let message = "Request failed.";

    try {
      const errorData = await response.json();
      message = errorData.detail || errorData.message || message;
    } catch {
      // Ignore if response is not JSON
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function getClients() {
  const response = await fetch(`${CLIENTS_URL}/`, {
    method: "GET",
  });

  return handleResponse(response);
}

export async function getClientById(clientId) {
  const response = await fetch(`${CLIENTS_URL}/${clientId}`, {
    method: "GET",
  });

  return handleResponse(response);
}

export async function createClient(payload) {
  const response = await fetch(`${CLIENTS_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function updateClient(clientId, payload) {
  const response = await fetch(`${CLIENTS_URL}/${clientId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function deleteClient(clientId) {
  const response = await fetch(`${CLIENTS_URL}/${clientId}`, {
    method: "DELETE",
  });

  return handleResponse(response);
}
