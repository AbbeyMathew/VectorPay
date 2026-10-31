import axios from 'axios';

// Same-origin by default: Vite proxies /api in dev and nginx proxies it in Docker.
// Set VITE_API_URL only if the API is hosted somewhere else.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // sends the httpOnly session cookie
  headers: { 'Content-Type': 'application/json' },
});

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) onUnauthorized();
    return Promise.reject(err);
  }
);

/** A message that is safe to show people, whatever went wrong. */
export function errorMessage(err, fallback = 'Something went wrong. Try again.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.request && !err.response) return "Can't reach the server. Check your connection and try again.";
  return fallback;
}

/** Per-field messages from the API, e.g. { phone: 'Enter a 10-digit phone number' }. */
export const fieldErrors = (err) => err?.response?.data?.errors || {};

export const isCanceled = (err) => axios.isCancel(err);

export default api;
