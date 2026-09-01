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

interface ListAdminsParams {
  search?: string;
}

export const adminService = {
  list: async (params: ListAdminsParams = {}) => {
    const { data } = await api.get('/users/admins', { params });
    return data;
  },
  create: async (payload: CreateAdminPayload) => {
    const { data } = await api.post('/users/admins', payload);
    return data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/users/${id}/status`, { status });
    return data;
  },
  update: async (id: string, payload: Partial<CreateAdminPayload>) => {
    const { data } = await api.patch(`/users/${id}`, payload);
    return data;
  },
  regeneratePassword: async (id: string) => {
    const { data } = await api.patch(`/users/${id}/regenerate-password`);
    return data;
  }
};
