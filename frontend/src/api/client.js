import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
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

export function errorMessage(err, fallback = 'Something went wrong. Try again.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.request && !err.response) return "Can't reach the server. Check your connection and try again.";
  return fallback;
}

export const fieldErrors = (err) => err?.response?.data?.errors || {};

export const isCanceled = (err) => axios.isCancel(err);

export default api;
