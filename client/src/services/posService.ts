import { api } from './api';

interface POSItem {
  serviceId: string;
  type: 'service' | 'event';
  name: string;
  qty: number;
  discountInPaisa: number;
}

interface CreatePOSPayload {
  customerId?: string;
  customerName: string;
  items: POSItem[];
  gstPercent: number;
  globalDiscountPercent: number;
  receiptRef: string;
}

interface ListPOSParams {
  page?: number;
  limit?: number;
}

export const posService = {
  list: async (params: ListPOSParams = {}) => {
    const { data } = await api.get('/pos', { params });
    return data;
  },
  create: async (payload: CreatePOSPayload) => {
    const { data } = await api.post('/pos', payload);
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/pos/${id}`);
    return data;
  },
};
