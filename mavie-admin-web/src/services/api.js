const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://10.121.159.39:5000";

export function getToken() {
  return localStorage.getItem("adminToken");
}

export function saveToken(token) {
  localStorage.setItem("adminToken", token);
}

export function logout() {
  localStorage.removeItem("adminToken");
}

async function request(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function loginAdmin(email, password) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data.user?.role !== "admin") {
    throw new Error("This account is not an admin account.");
  }

  saveToken(data.token);
  return data;
}

export function getAdminDashboard() {
  return request("/admin/dashboard");
}

export function getAdminPatients() {
  return request("/admin/patients");
}

export function getAdminPatientDetail(patientId) {
  return request(`/admin/patients/${patientId}`);
}

export function getAdminEmergencyEvents() {
  return request("/admin/emergency-events");
}