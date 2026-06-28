import { Roles } from '../utils/constants.js';
import type { AuthRequest } from './auth.middleware.js';

export const getTenantScope = (req: AuthRequest): Record<string, unknown> => {
  if (!req.user) return {};
  if (req.user.role === Roles.SUPER_ADMIN) return {};
  if (req.user.role === Roles.SALON_OWNER || req.user.role === Roles.STAFF) {
    return { salonId: req.user.salonId };
  }
  return { customerId: req.user._id };
};