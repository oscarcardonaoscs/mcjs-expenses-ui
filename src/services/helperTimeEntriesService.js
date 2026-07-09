import API_BASE_URL from "./api";

const HELPER_TIME_ENTRIES_URL = `${API_BASE_URL}/helper-time-entries`;
const HELPER_WORK_EVENTS_URL = `${API_BASE_URL}/helper-work-events`;

async function handleResponse(response) {
  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail = data?.detail;

    const message =
      typeof detail === "string"
        ? detail
        : data?.message || `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
}

// ---------------------------------------------------------
// TIME ENTRIES LIST
// ---------------------------------------------------------

export async function getHelperTimeEntries() {
  const response = await fetch(`${HELPER_TIME_ENTRIES_URL}/`, {
    method: "GET",
  });

  return handleResponse(response);
}

// ---------------------------------------------------------
// WORK EVENTS
// ---------------------------------------------------------

export async function createHelperTimeEntry(payload) {
  const response = await fetch(`${HELPER_WORK_EVENTS_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function getHelperWorkEvent(id) {
  const response = await fetch(`${HELPER_WORK_EVENTS_URL}/${id}`, {
    method: "GET",
  });

  return handleResponse(response);
}

export async function updateHelperWorkEvent(id, payload) {
  const response = await fetch(`${HELPER_WORK_EVENTS_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

// ---------------------------------------------------------
// TIME ENTRY DELETE
// ---------------------------------------------------------

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
