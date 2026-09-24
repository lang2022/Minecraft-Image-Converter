const FALLBACK_SITE_URL = 'https://example.com';

/**
 * Resolves the canonical site origin from NEXT_PUBLIC_SITE_URL.
 * Empty, whitespace-only or malformed values (common when the env var is
 * declared on the host but left blank) fall back instead of crashing the build.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK_SITE_URL;
  try {
    return new URL(raw).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}
