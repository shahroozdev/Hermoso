import { api } from './api';

interface BookingParams {
  page?: number;
  limit?: number;
  salonId?: string;
  status?: string;
  date?: string;
}

interface CreateBookingPayload {
  salonId: string;
  serviceId: string;
  staffId: string;
  bookingDate: string;
  bookingTime: string;
}

interface AvailabilityParams {
  salonId: string;
  serviceId: string;
  staffId: string;
  date: string;
}

interface BookingOptionsParams {
  salonId: string;
  serviceId?: string;
}

export const bookingService = {
  list: async (params: BookingParams = {}) => {
    const { data } = await api.get('/bookings', { params });
    return data;
  },
  create: async (payload: CreateBookingPayload) => {
    const { data } = await api.post('/bookings', payload);
    return data;
  },
  getAvailability: async (params: AvailabilityParams) => {
    const { data } = await api.get('/bookings/availability', { params });
    return data;
  },
  getOptions: async (params: BookingOptionsParams) => {
    const { data } = await api.get('/bookings/options', { params });
    return data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/bookings/${id}/status`, { status });
    return data;
  },
  getStats: async () => {
    const { data } = await api.get('/bookings/analytics/stats');
    return data;
  }
};
