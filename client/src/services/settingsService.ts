import { api } from './api';

export interface CommissionRules {
  defaultRate: number;
  vipRate: number;
  eventRate: number;
  promoRate: number;
}

export interface PlatformSettingsRecord {
  aiSkinScan: boolean;
  eventBookings: boolean;
  pushNotifications: boolean;
  selfRegistration: boolean;
  maintenanceMode: boolean;
  commissionRules?: CommissionRules;
}

export const settingsService = {
  get: async () => {
    const { data } = await api.get('/settings');
    return data;
  },
  update: async (payload: Partial<PlatformSettingsRecord>) => {
    const { data } = await api.patch('/settings', payload);
    return data;
  }
};
