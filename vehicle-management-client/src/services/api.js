import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const clearStoredAuth = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_role");
  localStorage.removeItem("auth_user");
};

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || "");
    const isLoginRequest = requestUrl.includes("/auth/login");

    if (status === 401 && !isLoginRequest) {
      clearStoredAuth();

      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// Auth
export const loginUser = (credentials) => API.post("/auth/login", credentials);
export const getProfile = () => API.get("/auth/me");
export const getActivitySummary = () => API.get("/activity-summary");
export const getAdminUsers = () => API.get("/admin/users");
export const getAdminRoles = () => API.get("/admin/roles");
export const createAdminUser = (payload) => API.post("/admin/users", payload);
export const updateAdminUserStatus = (userId, payload) =>
  API.put(`/admin/users/${userId}/status`, payload);
export const updateAdminUserRole = (userId, payload) =>
  API.put(`/admin/users/${userId}/role`, payload);
export const resetAdminUserPassword = (userId, payload) =>
  API.put(`/admin/users/${userId}/password`, payload);
export const getCustomers = () => API.get("/customers");
export const createCustomer = (payload) => API.post("/customers", payload);

//Vehicles
export const getVehicles = () => API.get("/vehicles");

export const addVehicle = (vehicle) => API.post("/vehicles", vehicle);

export const updateVehicle = (id, data) =>
API.put(`/vehicles/${id}`, data); // Updated endpoint for editing a vehicle
export const deleteVehicle = (id) =>
  API.delete(`/vehicles/${id}`);

// DELETED VEHICLES 
export const getDeletedVehicles = () =>
  API.get("/vehicles/deleted");

export const restoreVehicle = (id) =>
  API.put(`/vehicles/restore/${id}`);

// Services
export const getServices = () => API.get("/services");

// Job cards
export const getJobCards = () => API.get("/job-cards");

// Spare parts
export const getSpareParts = () => API.get("/spare-parts");

// Batteries
export const getBatteries = () => API.get("/batteries");
