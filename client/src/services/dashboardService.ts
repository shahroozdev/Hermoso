import { api } from './api';

export const dashboardService = {
  admin: async () => {
    const { data } = await api.get('/analytics/admin/dashboard');
    return data;
  },
  owner: async () => {
    const { data } = await api.get('/analytics/owner/dashboard');
    return data;
  }
};