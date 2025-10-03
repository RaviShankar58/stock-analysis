import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const API = axios.create({
  baseURL: BASE,
  timeout: 20000, // 20s - adjust if you want
  headers: { "Content-Type": "application/json" },
  // withCredentials: true, // enable later if you switch to cookies/httpOnly
});


// --- Request interceptor: add Authorization header automatically ---
API.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore localStorage errors in SSR contexts
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response interceptor: global 401 handling & pass through others ---
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // token invalid/expired — clear and redirect to login
      try {
        localStorage.removeItem("token");
      } catch (e) {} // ignore
      if (typeof window !== "undefined") {
        // replace location so user cannot go back to protected page
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

// --- Small helpers for token management (optional convenience) ---
export function setAuthToken(token) {
  if (!token) return;
  localStorage.setItem("token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("token");
}

export function getAuthToken() {
  return localStorage.getItem("token");
}


export default API;
