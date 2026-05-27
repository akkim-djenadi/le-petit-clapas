import client from './client';

export const getCommerces = (params) => client.get('/commerces', { params }).then(r => r.data);
export const getCommerce = (slug) => client.get(`/commerces/${slug}`).then(r => r.data);
export const deleteCommerce = (id) => client.delete(`/commerces/${id}`).then(r => r.data);
export const updateCommerce = (id, data) => client.put(`/commerces/${id}`, data).then(r => r.data);
