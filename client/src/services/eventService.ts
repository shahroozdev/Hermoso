import { api } from './api';

interface EventParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export const eventService = {
  list: async (params: EventParams = {}) => {
    const { data } = await api.get('/events', { params });
    return data;
  },
  create: async (payload: {
    name: string;
    description?: string;
    category: string;
    services: { serviceId: string }[];
    discount?: number;
    images?: string[];
  }) => {
    const { data } = await api.post('/events', payload);
    return data;
  },
  update: async (id: string, payload: Partial<{
    name: string;
    description: string;
    category: string;
    services: { serviceId: string }[];
    discount: number;
    images: string[];
    active: boolean;
  }>) => {
    const { data } = await api.put(`/events/${id}`, payload);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/events/${id}`);
    return data;
  }
};
