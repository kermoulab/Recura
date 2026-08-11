/**
 * Shared row-mapping helpers used by repositories.
 *
 * Repositories are responsible for translating domain entities (src/types/erp)
 * into database rows and back. These helpers are provider-agnostic value
 * transforms (the adapter owns the provider mechanics).
 */

/**
 * Normalizes a DB timestamp/date value to YYYY-MM-DD so it can be used in
 * <input type="date"> and date comparisons. Falls back to today when missing.
 */
export function toDateOnly(value?: string | null): string {
  if (!value) return new Date().toISOString().split('T')[0];
  const d = new Date(value);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  return d.toISOString().split('T')[0];
}
