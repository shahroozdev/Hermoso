import { api } from './api';

interface NotificationParams {
  page?: number;
  limit?: number;
  unreadOnly?: string;
  search?: string;
  targetRole?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  recipientsMin?: string | number;
  recipientsMax?: string | number;
}

interface AnnounceParams {
  title: string;
  message: string;
  targetRole: string;
  type: string;
}

export const notificationService = {
  list: async (params: NotificationParams = {}) => {
    const { data } = await api.get('/notifications', { params });
    return data;
  },
  markRead: async (id: string) => {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data;
  },
  announce: async (params: AnnounceParams) => {
    const { data } = await api.post('/notifications/announcement', params);
    return data;
  },
  create: async (params: AnnounceParams) => {
    const { data } = await api.post('/notifications', params);
    return data;
  },
  update: async (id: string, params: Partial<AnnounceParams>) => {
    const { data } = await api.patch(`/notifications/${id}`, params);
    return data;
  },
  send: async (id: string) => {
    const { data } = await api.post(`/notifications/${id}/send`);
    return data;
  },
  getRecipients: async (id: string) => {
    const { data } = await api.get(`/notifications/${id}/recipients`);
    return data;
  },
  getSentSummary: async () => {
    const { data } = await api.get('/notifications/reports/summary');
    return data;
  }
};
