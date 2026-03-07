import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const loginUser = (credentials) => API.post("/auth/login", credentials);
export const getProfile = () => API.get("/auth/me");

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
