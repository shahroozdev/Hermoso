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

interface RefundRequestPayload {
  bookingId: string;
  reason: string;
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
  },
  createCheckout: async (bookingId: string) => {
    const { data } = await api.post('/payments/checkout', { bookingId });
    return data;
  },
  getPaymentStatus: async (tracker: string) => {
    const { data } = await api.get(`/payments/${tracker}/status`);
    return data;
  },
  requestRefund: async (payload: RefundRequestPayload) => {
    const { data } = await api.post('/refunds/request', payload);
    return data;
  }
};
