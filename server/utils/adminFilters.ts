import { ApiError } from './ApiError.js';

export function adminFilters(query: Record<string, unknown>) {
  const match: Record<string, unknown> = { role: { $in: ['admin', 'super_admin'] } };
  if (query.role) {
    if (!['admin', 'super_admin'].includes(String(query.role))) throw new ApiError(400, 'Invalid admin role');
    match.role = query.role;
  }
  if (query.search) {
    const term = new RegExp(String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    match.$or = [{name: term}, {email: term}];
  }
  const dates: Record<string, Date> = {};
  for (const [key, op] of [['fromDate', '$gte'], ['toDate', '$lte']]) {
    if (!query[key]) continue;
    const value = String(query[key]);
    const date = new Date(`${value}T${op === '$gte' ? '00:00:00.000' : '23:59:59.999'}Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value) throw new ApiError(400, 'Invalid joined date');
    dates[op] = date;
  }
  if (dates.$gte && dates.$lte && dates.$gte > dates.$lte) throw new ApiError(400, 'From date must not be after To date');
  if (Object.keys(dates).length) match.createdAt = dates;
  return match;
}
