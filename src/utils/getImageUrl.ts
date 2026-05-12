const RAW = process.env.EXPO_PUBLIC_API_URL ?? '';
// Strip /api/v1 suffix to get the static-files root
const BASE_URL = RAW.replace(/\/api\/v1\/?$/, '');

/**
 * Converts a stored URL/path to a fully-qualified URL.
 * - Already absolute (http/https)  → returned as-is
 * - Relative path (/uploads/...)   → BASE_URL prepended
 * - Null/undefined                 → null
 */
export function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url}`;
}