import { create } from 'zustand';

type Theme = 'dark' | 'light';

const detectTheme = (): Theme => {
  const saved = localStorage.getItem('ha_theme') || localStorage.getItem('hermoso_theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

interface UIState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  salonModalOpen: boolean;
  openSalonModal: () => void;
  setSalonModal: (isOpen: boolean) => void;
  closeSalonModal: () => void;
  ownerModalOpen: boolean;
  openOwnerModal: () => void;
  setOwnerModal: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: detectTheme(),
  setTheme: (theme) => {
    localStorage.setItem('ha_theme', theme);
    localStorage.setItem('hermoso_theme', theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('ha_theme', theme);
      localStorage.setItem('hermoso_theme', theme);
      return { theme };
    }),
  salonModalOpen: false,
  openSalonModal: () => set({ salonModalOpen: true }),
  setSalonModal: (isOpen: boolean) => set({ salonModalOpen: isOpen }),
  closeSalonModal: () => set({ salonModalOpen: false }),
  ownerModalOpen: false,
  openOwnerModal: () => set({ ownerModalOpen: true }),
  setOwnerModal: (isOpen: boolean) => set({ ownerModalOpen: isOpen })
}));