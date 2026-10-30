// Base URL of the backend. Empty on the web (same-origin /api); set VITE_API_BASE_URL
// when building the Android app so it can reach the deployed server.
export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
