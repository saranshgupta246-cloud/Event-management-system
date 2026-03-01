import axios from "axios";

const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const api = axios.create({
  baseURL: apiOrigin,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ems_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("ems_token");
      const path = typeof window !== "undefined" ? window.location.pathname : "";
      if (path && !path.startsWith("/login") && !path.startsWith("/register")) {
        if (typeof window !== "undefined") window.location.href = "/login";
      }
    }
    const message = err.response?.data?.message ?? err.message ?? "Request failed";
    return Promise.reject({ ...err, message });
  }
);

export default api;
