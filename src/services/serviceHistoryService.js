import API_BASE_URL from "./api";

const SERVICE_HISTORY_URL = `${API_BASE_URL}/history/service-history`;

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

export async function getServiceHistory(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  if (!params.has("skip")) {
    params.set("skip", "0");
  }

  if (!params.has("limit")) {
    params.set("limit", "500");
  }

  const response = await fetch(`${SERVICE_HISTORY_URL}?${params.toString()}`, {
    method: "GET",
  });

  return handleResponse(response);
}
