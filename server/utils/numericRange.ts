export const numericRange = (min: unknown, max: unknown): Record<string, number> | undefined => {
  const range: Record<string, number> = {};
  if (min !== undefined && min !== "") range.$gte = Number(min);
  if (max !== undefined && max !== "") range.$lte = Number(max);
  return Object.keys(range).length ? range : undefined;
};
