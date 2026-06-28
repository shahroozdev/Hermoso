import { api } from './api';

interface NotificationParams {
  page?: number;
  limit?: number;
  unreadOnly?: string;
}

interface AnnounceParams {
  title: string;
  message: string;
  targetRole: string;
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
  }
};