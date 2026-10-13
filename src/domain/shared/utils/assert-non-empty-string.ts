export function assertValidString(value: unknown): string | null {
  if (!['string', 'number'].includes(typeof value)) return null;
  if (typeof value === 'number' && isNaN(value as any)) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  return normalized;
}
