import axios from "axios";

const API_URL =  "http://localhost:1337/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

// aggiorna dinamicamente il token se cambia
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
