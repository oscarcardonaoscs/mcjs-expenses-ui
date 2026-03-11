import API_BASE_URL from "./api";

const HELPER_PAYROLL_PERIODS_URL = `${API_BASE_URL}/helper-payroll-periods`;

async function handleResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(data?.detail || "Request failed.");
  }

  return data;
}

export async function getHelperPayrollPeriods(filters = {}) {
  const params = new URLSearchParams();

  if (filters.skip != null) params.append("skip", filters.skip);
  if (filters.limit != null) params.append("limit", filters.limit);
  if (filters.helper_id) params.append("helper_id", filters.helper_id);
  if (filters.status) params.append("status", filters.status);

  const queryString = params.toString();
  const url = queryString
    ? `${HELPER_PAYROLL_PERIODS_URL}/?${queryString}`
    : `${HELPER_PAYROLL_PERIODS_URL}/`;

  const response = await fetch(url, {
    method: "GET",
  });

  return handleResponse(response);
}

export async function getHelperPayrollPeriod(payrollId) {
  const response = await fetch(`${HELPER_PAYROLL_PERIODS_URL}/${payrollId}`, {
    method: "GET",
  });

  return handleResponse(response);
}

export async function generateHelperPayrollPeriod(payload) {
  const response = await fetch(`${HELPER_PAYROLL_PERIODS_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function updateHelperPayrollPeriod(payrollId, payload) {
  const response = await fetch(`${HELPER_PAYROLL_PERIODS_URL}/${payrollId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function deleteHelperPayrollPeriod(payrollId) {
  const response = await fetch(`${HELPER_PAYROLL_PERIODS_URL}/${payrollId}`, {
    method: "DELETE",
  });

  return handleResponse(response);
}

export async function markHelperPayrollPeriodPaid(payrollId, payload) {
  const response = await fetch(
    `${HELPER_PAYROLL_PERIODS_URL}/${payrollId}/mark-paid`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  return handleResponse(response);
}
