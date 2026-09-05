import { api } from './api';

interface ServiceParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  categoryId?: string;
  salonId?: string;
}

export const serviceService = {
  list: async (params: ServiceParams = {}) => {
    const { data } = await api.get('/services', { params });
    return data;
  },
  create: async (payload: { name: string; description?: string; priceInPaisa: number; duration: number; categoryId: string; salonId?: string }) => {
    const { data } = await api.post('/services', payload);
    return data;
  },
  update: async (id: string, payload: Partial<{ name: string; description: string; priceInPaisa: number; duration: number; categoryId: string; active: boolean }>) => {
    const { data } = await api.put(`/services/${id}`, payload);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/services/${id}`);
    return data;
  }
};
