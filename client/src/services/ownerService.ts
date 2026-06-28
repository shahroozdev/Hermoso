import { api } from './api';

export interface OwnerRecord {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  bankAccount?: string;
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

export const ownerService = {
  list: async () => {
    const { data } = await api.get('/users/owners');
    return data;
  },
  create: async (payload: CreateOwnerPayload) => {
    const { data } = await api.post('/users/owners', payload);
    return data;
  }
};
