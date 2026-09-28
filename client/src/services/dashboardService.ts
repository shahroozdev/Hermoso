import { api } from './api';

export const dashboardService = {
  admin: async (params: { range?: string; year?: string } = {}) => {
    const { data } = await api.get('/analytics/admin/dashboard', { params });
    return data;
  },
  owner: async (params: { range?: string } = {}) => {
    const { data } = await api.get('/analytics/owner/dashboard', { params });
    return data;
  }
};
