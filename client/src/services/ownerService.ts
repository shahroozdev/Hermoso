import { api } from './api';

export interface OwnerRecord {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  bankAccount?: string;
  status?: string;
  createdAt?: string;
  location?: {
    city?: string;
    country?: string;
  };
  salonsCount?: number;
}

interface CreateOwnerPayload {
  name: string;
  city: string;
  country: string;
  email?: string;
  password?: string;
  phone?: string;
  bankAccount?: string;
}

interface ListOwnersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const ownerService = {
  list: async (params: ListOwnersParams = {}) => {
    // Default to a high limit so callers that just want "all owners" (e.g. the salon owner
    // picker) don't need to know about pagination.
    const { data } = await api.get('/users/owners', { params: { limit: 500, ...params } });
    return data;
  },
  create: async (payload: CreateOwnerPayload) => {
    const { data } = await api.post('/users/owners', payload);
    return data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/users/${id}/status`, { status });
    return data;
  },
  update: async (id: string, payload: Partial<CreateOwnerPayload>) => {
    const { data } = await api.patch(`/users/${id}`, payload);
    return data;
  }
};
