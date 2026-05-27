import client from './client';

export const getCategories = () => client.get('/categories').then(r => r.data);
export const createCategory = (data) => client.post('/categories', data).then(r => r.data);
export const createSubcategory = (catId, data) => client.post(`/categories/${catId}/subcategories`, data).then(r => r.data);
export const deleteCategory = (id) => client.delete(`/categories/${id}`).then(r => r.data);
