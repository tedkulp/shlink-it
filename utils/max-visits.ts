// The popup's "Max Visits" number input, as the browser reports it.
export interface MaxVisitsField {
  // The input's `.value`.
  value: string;
  // The input's `.validity.badInput`. A number input reports unparseable
  // text (e.g. "abc") as an empty value with this flag set.
  badInput: boolean;
}

// What a type=number input accepts: an HTML "valid floating-point number"
// (e.g. "5", "10.0", "1e3"), so no hex, "Infinity" or trailing junk.
const FLOATING_POINT_NUMBER = /^-?(\d+(\.\d+)?|\.\d+)([eE][+-]?\d+)?$/;

// Parses the "Max Visits" field into what Shlink expects: a positive
// integer, or null for unlimited. Throws on anything else.
export const parseMaxVisits = ({
  value,
  badInput,
}: MaxVisitsField): number | null => {
  const trimmed = value.trim();
  if (trimmed === '' && !badInput) return null;
  const n = FLOATING_POINT_NUMBER.test(trimmed) ? Number(trimmed) : Number.NaN;
  if (badInput || !Number.isSafeInteger(n) || n <= 0) {
    throw new Error('Max Visits must be a positive whole number.');
  }
  return n;
};
