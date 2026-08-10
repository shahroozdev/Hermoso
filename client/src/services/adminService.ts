import { api } from './api';

export interface AdminRecord {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status?: string;
  createdAt?: string;
}

interface CreateAdminPayload {
  name: string;
  email?: string;
  password?: string;
  phone?: string;
}

export const adminService = {
  list: async () => {
    const { data } = await api.get('/users/admins');
    return data;
  },
  create: async (payload: CreateAdminPayload) => {
    const { data } = await api.post('/users/admins', payload);
    return data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/users/${id}/status`, { status });
    return data;
  }
};
