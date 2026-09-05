import { api } from './api';

export interface CategoryRecord {
  _id: string;
  name: string;
}

export const categoryService = {
  list: async () => {
    const { data } = await api.get('/categories');
    return data;
  },
  create: async (payload: { name: string }) => {
    const { data } = await api.post('/categories', payload);
    return data;
  },
  update: async (id: string, payload: { name: string }) => {
    const { data } = await api.patch(`/categories/${id}`, payload);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/categories/${id}`);
    return data;
  }
};
