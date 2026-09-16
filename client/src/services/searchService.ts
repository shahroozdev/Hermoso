import { api } from './api';

export interface SearchCustomer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface SearchBooking {
  _id: string;
  bookingDate?: string;
  bookingTime?: string;
  status?: string;
  customer?: { _id: string; name?: string };
  salon?: { _id: string; name?: string };
}

export interface SearchSalon {
  _id: string;
  name: string;
  location?: { city?: string };
}

export interface GlobalSearchResult {
  customers: SearchCustomer[];
  bookings: SearchBooking[];
  salons: SearchSalon[];
}

export const searchService = {
  global: async (q: string) => {
    const { data } = await api.get<{ success: boolean; data: GlobalSearchResult }>('/search', { params: { q } });
    return data;
  },
};
