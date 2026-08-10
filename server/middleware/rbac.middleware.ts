import { Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import type { AuthRequest } from './auth.middleware.js';

// 'admin' gets the same route-level access as 'super_admin' everywhere except admin-account
// management, which individual controllers gate with an explicit super_admin-only check
// (see requireSuperAdmin in user.controller.ts).
const normalizeRole = (role?: string) => {
  if (role === 'admin') return 'super_admin';
  return role;
};

export const authorize = (...allowedRoles: string[]) => (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new ApiError(401, 'Unauthorized'));
  const normalizedUserRole = normalizeRole(req.user.role);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
    return next(new ApiError(403, 'Forbidden'));
  }
  next();
};
