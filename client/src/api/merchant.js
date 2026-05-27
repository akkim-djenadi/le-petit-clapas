import client from './client';

export const getMyOffers = () => client.get('/ticket-offers/mine').then(r => r.data);
export const createOffer = (data) => client.post('/ticket-offers', data).then(r => r.data);
export const updateOffer = (id, data) => client.put(`/ticket-offers/${id}`, data).then(r => r.data);
export const getMyReviews = () => client.get('/reviews/mine').then(r => r.data);
export const getMyProfile = () => client.get('/merchant/profile').then(r => r.data);
export const getMerchantStats = () => client.get('/merchant/stats').then(r => r.data);
