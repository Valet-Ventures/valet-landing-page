/** Shared email handling for the waitlist. Kept dependency-free so it is directly testable. */

/**
 * Permissive sanity check. Deliberately not a strict RFC regex: those reject valid addresses
 * far more often than they catch typos, and the real validation is the confirmation email
 * arriving or not.
 */
export function isPlausibleEmail(value: string): boolean {
  if (value.length < 3 || value.length > 254 || /\s/.test(value)) return false;
  const at = value.lastIndexOf("@");
  if (at <= 0 || at === value.length - 1) return false;
  const domain = value.slice(at + 1);
  if (!domain.includes(".")) return false;
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) return false;
  return true;
}

/** Matches the `lower(btrim(...))` the database trigger and claim function apply. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
