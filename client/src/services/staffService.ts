import { api } from './api';

interface StaffParams {
  page?: number;
  limit?: number;
  search?: string;
  salonId?: string;
  designation?: string;
}

interface StaffLocation {
  city?: string;
  country?: string;
}

interface StaffDetails {
  designation: string;
  salary: number;
  salaryType: 'monthly' | 'weekly' | 'daily' | 'hourly';
  joiningDate: string;
  shiftStartTime: string;
  shiftEndTime: string;
  commissionPercentage?: number;
  emergencyContact?: string;
  workingDays: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
}

interface CreateStaffPayload {
  name: string;
  email: string;
  // password: string;
  phone: string;
  bankAccount?: string;
  location?: StaffLocation;
  staffDetails: StaffDetails;
}

type UpdateStaffPayload = Partial<Omit<CreateStaffPayload, 'password'> & { active: boolean }>;

export const staffService = {
  list: async (params: StaffParams = {}) => {
    const { data } = await api.get('/staff', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/staff/${id}`);
    return data;
  },

  create: async (payload: CreateStaffPayload) => {
    const { data } = await api.post('/staff', payload);
    return data;
  },

  update: async (id: string, payload: UpdateStaffPayload) => {
    const { data } = await api.put(`/staff/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/staff/${id}`);
    return data;
  },
};