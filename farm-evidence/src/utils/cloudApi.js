const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function request(path, token, body) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Cloud request failed: ${res.status}`);
  }
  return res.json();
}

export const saveCloudState = (token, payload) => request("/sync/save", token, payload);
export const loadCloudState = (token) => request("/sync/load", token, {});
export const computeCloudComparison = (token) => request("/comparison/compute", token, {});
export const computeBackendAnalysis = (token, payload) => request("/analysis/compute", token, payload);

// Send mechanism/formula/descriptive content to backend for owner-only access
export const sendMechanism = (payload) => request("/mechanism/receive", null, payload).catch(() => null);
