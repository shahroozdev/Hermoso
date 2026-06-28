import { api } from './api';

interface PayoutParams {
  page?: number;
  limit?: number;
  salonId?: string;
  status?: string;
}

export const payoutService = {
  list: async (params: PayoutParams = {}) => {
    const { data } = await api.get('/payouts', { params });
    return data;
  },
  request: async (amount: number) => {
    const { data } = await api.post('/payouts/request', { amount });
    return data;
  }
};