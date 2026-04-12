import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Inject auth token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — only force-logout when there's genuinely no valid token
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      const token = localStorage.getItem("tf_token");
      const url: string = err.config?.url ?? "";
      const isAuthEndpoint = url.includes("/auth/");
      if (!token || isAuthEndpoint) {
        localStorage.removeItem("tf_token");
        localStorage.removeItem("tf_user");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  },
);

export default api;
