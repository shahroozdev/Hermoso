import { api } from './api';

interface CustomerParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  bookingsMin?: number | string;
  bookingsMax?: number | string;
  spentMin?: number | string;
  spentMax?: number | string;
  fromDate?: string;
  toDate?: string;
}

export const customerService = {
  list: async (params: CustomerParams = {}) => {
    const { data } = await api.get('/customers', { params });
    return data;
  },
  getOverview: async (params: CustomerParams = {}) => {
    const { data } = await api.get('/customers/analytics/overview', { params });
    return data;
  },
  getActivity: async (id: string) => {
    const { data } = await api.get(`/customers/${id}/activity`);
    return data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/users/${id}/status`, { status });
    return data;
  }
};
