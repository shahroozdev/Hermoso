import { ApiError } from './ApiError.js';

export function validateStaffCommission(body: { staffDetails?: { commissionPercentage?: unknown } }) {
  const value = body.staffDetails?.commissionPercentage;
  if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100)) {
    throw new ApiError(400, 'Commission must be a number between 0 and 100');
  }
}
