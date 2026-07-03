import { api } from './api';
import { tokenCookies } from '../utils/tokenCookies';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
}
interface VerifyOtpPayload {
  email: string;
  otp: string;
}

interface UpdateProfilePayload {
  name: string;
  phone?: string;
  city?: string;
  country?: string;
  bankAccount?: string;
  southAsianSpecialist?: boolean;
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const authService = {
  login: async (payload: LoginPayload) => {
    const { data } = await api.post('/auth/login', payload);
    if (data?.accessToken && data?.refreshToken) {
      tokenCookies.set(data.accessToken, data.refreshToken);
    }
    return data;
  },
  register: async (payload: RegisterPayload) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },
  verifyOtp: async (payload: VerifyOtpPayload) => {
    const { data } = await api.post('/auth/verify-otp', payload);
    return data;
  },
  resendOtp: async (email: string) => {
    const { data } = await api.post('/auth/resend-otp', { email });
    return data;
  },
  refresh: async () => {
    const { data } = await api.post('/auth/refresh', { refreshToken: tokenCookies.getRefreshToken() });
    if (data?.accessToken && data?.refreshToken) {
      tokenCookies.set(data.accessToken, data.refreshToken);
    }
    return data;
  },
  logout: async () => {
    const { data } = await api.post('/auth/logout', { refreshToken: tokenCookies.getRefreshToken() });
    tokenCookies.clear();
    return data;
  },
  getProfile: async () => {
    const { data } = await api.get('/users/me');
    return data;
  },
  updateProfile: async (payload: UpdateProfilePayload) => {
    const { data } = await api.patch('/users/me', payload);
    return data;
  },
  changePassword: async (payload: ChangePasswordPayload) => {
    const { data } = await api.patch('/users/me/password', payload);
    return data;
  }
};
