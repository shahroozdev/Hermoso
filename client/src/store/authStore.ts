import { create } from 'zustand';
import { tokenCookies } from '../utils/tokenCookies';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  salonId?: string;
  status: string;
  phone?: string;
  location?: {
    city?: string;
    country?: string;
  };
  bankAccount?: string;
  southAsianSpecialist?: boolean;
}

interface AuthState {
  user: User | null;
  setAuth: ({ user }: { user: User }) => void;
  updateUser: (user: User) => void;
  logout: () => void;
  token: string | null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('hermoso_user') || 'null'),
  setAuth: ({ user }) => {
    localStorage.setItem('hermoso_user', JSON.stringify(user));
    set({ user });
  },
  token: tokenCookies.getAccessToken(),
  updateUser: (user) => {
    localStorage.setItem('hermoso_user', JSON.stringify(user));
    set((state) => ({ ...state, user }));
  },
  logout: () => {
    tokenCookies.clear();
    localStorage.removeItem('hermoso_user');
    set({ user: null });
  }
}));
