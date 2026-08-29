import { api } from './api';

export interface PlatformSettingsRecord {
  aiSkinScan: boolean;
  eventBookings: boolean;
  pushNotifications: boolean;
  selfRegistration: boolean;
  maintenanceMode: boolean;
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
