import { api } from './api';

interface ReviewParams {
  page?: number;
  limit?: number;
  salonId?: string;
  status?: string;
  customer?: string;
  salon?: string;
  rating?: number | string;
  search?: string;
}

export const reviewService = {
  list: async (params: ReviewParams = {}) => {
    const { data } = await api.get('/reviews', { params });
    return data;
  },
  moderateAll: async () => {
    const { data } = await api.patch('/reviews/moderate-all');
    return data;
  },
  create: async (payload: { salonId: string; rating: number; comment?: string }) => {
    const { data } = await api.post('/reviews', payload);
    return data;
  },
  moderate: async (id: string, status: 'approved' | 'rejected' | 'flagged' | 'deleted') => {
    const { data } = await api.patch(`/reviews/${id}/moderate`, { status });
    return data;
  },
  getStats: async () => {
    const { data } = await api.get('/reviews/analytics/stats');
    return data;
  }
};