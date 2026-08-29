import { Response } from 'express';
import { PlatformSettings } from '../models/PlatformSettings.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

interface UpdateSettingsBody {
  aiSkinScan?: boolean;
  eventBookings?: boolean;
  pushNotifications?: boolean;
  selfRegistration?: boolean;
  maintenanceMode?: boolean;
}

export const getPlatformSettings = asyncHandler(async (_req: AuthRequest, res: Response) => {
  let settings = await PlatformSettings.findOne();
  if (!settings) {
    settings = await PlatformSettings.create({});
  }
  res.json({ success: true, data: settings });
});

export const updatePlatformSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = req.body as UpdateSettingsBody;
  const settings = await PlatformSettings.findOneAndUpdate({}, { $set: body }, { new: true, upsert: true });
  res.json({ success: true, data: settings, message: 'Settings saved successfully' });
});
