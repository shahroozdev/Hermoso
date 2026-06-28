import { api } from './api';

interface SalonParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  city?: string;
}

interface CreateSalonPayload {
  name: string;
  description?: string;
  address: string;
  phone: string;
  ownerId?: string;
  location?: { city?: string; country?: string };
  commissionRate?: number;
}

export const salonService = {
  list: async (params: SalonParams = {}) => {
    const { data } = await api.get('/salons', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/salons/${id}`);
    return data;
  },
  revenue: async () => {
    const { data } = await api.get('/salons/analytics/revenue');
    return data;
  },
  updateStatus: async (id: string, payload: { status: string; commissionRate?: number }) => {
    const { data } = await api.patch(`/salons/${id}/status`, payload);
    return data;
  },
  create: async (payload: CreateSalonPayload) => {
    const { data } = await api.post('/salons', payload);
    return data;
  },
  update: async (id: string, payload: Partial<CreateSalonPayload>) => {
    const { data } = await api.put(`/salons/${id}`, payload);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/salons/${id}`);
    return data;
  }
};
