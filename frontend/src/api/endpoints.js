import api from './client';

export const authApi = {
  me: () => api.get('/auth/me'),
  login: (body) => api.post('/auth/login', body),
  register: (body) => api.post('/auth/register', body),
  logout: () => api.post('/auth/logout'),
  forgot: (email) => api.post('/auth/forgot', { email }),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  reset: (resetToken, password) => api.post('/auth/reset', { resetToken, password }),
};

export const walletApi = {
  get: () => api.get('/wallet'),
  topUp: (amount) => api.post('/wallet/topup', { amount }),
  transfer: (payload) => api.post('/wallet/transfer', payload),
  transactions: (params) => api.get('/wallet/transactions', { params }),
  dailySpend: (params) => api.get('/wallet/spend/daily', { params }),
  summary: (params) => api.get('/wallet/summary', { params }),
};

export const userApi = {
  lookup: (phone, signal) => api.get('/users/lookup', { params: { phone }, signal }),
};

export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: (search) => api.get('/admin/users', { params: { search } }),
};
