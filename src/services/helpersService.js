import API_BASE_URL from "./api";

const HELPERS_URL = `${API_BASE_URL}/helpers/`;

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = "An error occurred while processing the request.";

    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch (error) {
      // Ignore JSON parse errors and use default message
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function getHelpers() {
  const response = await fetch(HELPERS_URL, {
    method: "GET",
  });

  return handleResponse(response);
}

export async function getHelperById(id) {
  const response = await fetch(`${HELPERS_URL}${id}`, {
    method: "GET",
  });

  return handleResponse(response);
}

export async function createHelper(data) {
  const response = await fetch(HELPERS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

export async function updateHelper(id, data) {
  const response = await fetch(`${HELPERS_URL}${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

export async function deleteHelper(id) {
  const response = await fetch(`${HELPERS_URL}${id}`, {
    method: "DELETE",
  });

  return handleResponse(response);
}
