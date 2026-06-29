import { api } from './api';

interface SalonParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  city?: string;
}

export interface CreateSalonPayload {
  name: string;
  description?: string;
  address: string;
  phone: string;
  ownerId?: string;
  location?: { city?: string; country?: string };
  workingHours?: Record<string, { open: string; close: string; off: boolean }>;
  commissionRate?: number;
  imageFile?: File | null;
}

const buildFormData = (payload: Record<string, unknown>, file: File): FormData => {
  const fd = new FormData();
  fd.append('imageUrl', file);
  for (const [key, value] of Object.entries(payload)) {
    if (key === 'imageFile' || value === undefined || value === null) continue;
    if (typeof value === 'object') {
      fd.append(key, JSON.stringify(value));
    } else {
      fd.append(key, String(value));
    }
  }
  return fd;
};

export const salonService = {
  list: async (params: SalonParams = {}) => {
    const { data } = await api.get('/salons', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/salons/${id}`);
    return data;
  },
  revenue: async () => {
    const { data } = await api.get('/salons/analytics/revenue');
    return data;
  },
  updateStatus: async (id: string, payload: { status: string; commissionRate?: number }) => {
    const { data } = await api.patch(`/salons/${id}/status`, payload);
    return data;
  },
  create: async (payload: CreateSalonPayload) => {
    if (payload.imageFile) {
      const fd = buildFormData(payload as unknown as Record<string, unknown>, payload.imageFile);
      const { data } = await api.post('/salons', fd);
      return data;
    }
    const { imageFile: _fi, ...jsonPayload } = payload;
    void _fi;
    const { data } = await api.post('/salons', jsonPayload);
    return data;
  },
  update: async (id: string, payload: Partial<CreateSalonPayload>) => {
    if (payload.imageFile) {
      const fd = buildFormData(payload as unknown as Record<string, unknown>, payload.imageFile);
      const { data } = await api.put(`/salons/${id}`, fd);
      return data;
    }
    const { imageFile: _fi, ...jsonPayload } = payload;
    void _fi;
    const { data } = await api.put(`/salons/${id}`, jsonPayload);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/salons/${id}`);
    return data;
  },
  getCities: async () => {
    const { data } = await api.get('/salons/cities');
    return data;
  },
  getStatusStats: async () => {
    const { data } = await api.get('/salons/analytics/status-stats');
    return data;
  },
  getRevenueStats: async () => {
    const { data } = await api.get('/salons/analytics/revenue-stats');
    return data;
  }
};
