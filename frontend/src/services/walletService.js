import api from '../api/axios'; 

export const me = () => api.get('/wallet/me'); 
export const topup = amount => api.post('/wallet/topup', { amount }); 
export const transfer = payload => api.post('/wallet/transfer', payload); 
export const transactions = () => api.get('/wallet/transactions');
