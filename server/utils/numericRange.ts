export const numericRange = (min: unknown, max: unknown, operator?: unknown): Record<string, number> | undefined => {
  if (['eq', 'gt', 'gte', 'lt', 'lte'].includes(String(operator))) {
    const raw = min !== undefined && min !== '' ? min : max;
    if (raw === undefined || raw === '' || !Number.isFinite(Number(raw))) return undefined;
    return { [`$${operator}`]: Number(raw) };
  }
  const range: Record<string, number> = {};
  if (min !== undefined && min !== "" && Number.isFinite(Number(min))) range.$gte = Number(min);
  if (max !== undefined && max !== "" && Number.isFinite(Number(max))) range.$lte = Number(max);
  return Object.keys(range).length ? range : undefined;
};
