import { ApiError } from './ApiError.js';

export function dateRange(from: unknown, to: unknown) {
  const parse = (value: unknown) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ApiError(400, 'Invalid date filter');
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new ApiError(400, 'Invalid date filter');
    return date;
  };
  if (!from && !to) return undefined;
  const range: {$gte?: Date; $lte?: Date} = {};
  if (from) range.$gte = parse(from);
  if (to) { range.$lte = parse(to); range.$lte.setUTCHours(23, 59, 59, 999); }
  if (range.$gte && range.$lte && range.$gte > range.$lte) throw new ApiError(400, 'From date must not follow To date');
  return range;
}
