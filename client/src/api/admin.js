import client from './client';

export const getStats = () => client.get('/admin/stats').then(r => r.data);
export const getMerchants = () => client.get('/admin/merchants').then(r => r.data);
export const creditMerchant = (data) => client.post('/admin/credits', data).then(r => r.data);
export const getCreditHistory = (id) => client.get(`/admin/credits/${id}`).then(r => r.data);
export const getPendingReviews = (status = 'pending') => client.get(`/admin/reviews?status=${status}`).then(r => r.data);
export const moderateReview = (id, status) => client.put(`/reviews/${id}/moderate`, { status }).then(r => r.data);
export const getGames = () => client.get('/games').then(r => r.data);
export const createGame = (data) => client.post('/games', data).then(r => r.data);
export const previewCSV = (formData) => client.post('/admin/import-csv/preview', formData).then(r => r.data);
export const executeCSV = (formData) => client.post('/admin/import-csv/execute', formData).then(r => r.data);
