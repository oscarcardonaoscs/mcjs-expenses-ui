import API_BASE_URL from "./api";

const HELPER_TIME_ENTRIES_URL = `${API_BASE_URL}/helper-time-entries`;

async function handleResponse(response) {
  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
}

export async function getHelperTimeEntries() {
  const response = await fetch(`${HELPER_TIME_ENTRIES_URL}/`, {
    method: "GET",
  });

  return handleResponse(response);
}

export async function createHelperTimeEntry(payload) {
  const response = await fetch(`${HELPER_TIME_ENTRIES_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function updateHelperTimeEntry(id, payload) {
  const response = await fetch(`${HELPER_TIME_ENTRIES_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function deleteHelperTimeEntry(id) {
  const response = await fetch(`${HELPER_TIME_ENTRIES_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    const message =
      data?.detail ||
      data?.message ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return true;
}
