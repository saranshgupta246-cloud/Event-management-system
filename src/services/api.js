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
    if (err.response?.status === 503) {
      const message = err.response?.data?.message ?? "Backend database unavailable. Is MongoDB running?";
      return Promise.reject({ ...err, message });
    }
    if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
      const message = "Cannot reach backend. Is the server running on port 5000? Start it with: npm run dev (in backend folder)";
      return Promise.reject({ ...err, message });
    }
    const message = err.response?.data?.message ?? err.message ?? "Request failed";
    return Promise.reject({ ...err, message });
  }
);

export default api;
