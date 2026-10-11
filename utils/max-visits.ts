// Parses the popup's "Max Visits" field into what Shlink expects:
// a positive integer, or null for unlimited. Throws on anything else.
export const parseMaxVisits = (raw: unknown): number | null => {
  const value = String(raw == null ? '' : raw).trim();
  if (value === '') return null;
  if (!/^\d+$/.test(value) || Number(value) <= 0) {
    throw new Error('Max Visits must be a positive whole number.');
  }
  return Number(value);
};
