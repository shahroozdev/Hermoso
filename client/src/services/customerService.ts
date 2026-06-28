import { api } from './api';

interface CustomerParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const customerService = {
  list: async (params: CustomerParams = {}) => {
    const { data } = await api.get('/customers', { params });
    return data;
  }
};