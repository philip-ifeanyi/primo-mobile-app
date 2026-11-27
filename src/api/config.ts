/**
 * Where the backend lives.
 *
 * The API is an ABP (ASP.NET Boilerplate) service. The web portal
 * (primo-portal-nextjs) hardcodes `https://104.131.48.195:44301/api`; that
 * value is in .env.example rather than here, because a raw IP baked into a
 * shipped binary cannot be changed without a new build.
 *
 * Expo inlines EXPO_PUBLIC_* variables at build time, so this reads straight
 * from the environment and needs no app.json entry — app.json does no
 * interpolation, and an `extra` holding "${EXPO_PUBLIC_API_URL}" would ship
 * that literal string as the URL.
 */
const configured = process.env.EXPO_PUBLIC_API_URL ?? '';

/** Trailing slashes make every joined path a double-slash. */
export const API_BASE_URL = configured.replace(/\/+$/, '');

/**
 * False until a base URL is supplied, in which case the services fall back to
 * local stubs. A single explicit flag rather than a silent try/catch: when it
 * is false the app is running on fixtures, and that should be easy to grep.
 */
export const IS_API_CONFIGURED = API_BASE_URL.length > 0;

/**
 * ABP multi-tenancy. This is sent in the Authenticate body and nowhere else:
 * the issued token carries the tenant claim, so later calls need no header.
 * (Verified against the portal, which likewise sends it only at login.)
 *
 * Tenant 1 is the only tenant this deployment has. The env var exists so a
 * second deployment would not need a code change, but a missing, empty or
 * non-numeric value must fall back to 1 rather than to Number('') === 0 or
 * NaN, either of which would fail authentication with nothing to point at.
 */
const parsedTenant = Number.parseInt(process.env.EXPO_PUBLIC_TENANT_ID ?? '', 10);
export const TENANT_ID = Number.isFinite(parsedTenant) && parsedTenant > 0 ? parsedTenant : 1;

/** Anything slower than this is a hung request, not a slow one. */
export const REQUEST_TIMEOUT_MS = 20_000;

if (__DEV__ && !IS_API_CONFIGURED) {
  console.warn(
    '[api] No EXPO_PUBLIC_API_URL set — running on local stubs. ' +
      'Copy .env.example to .env to talk to the real backend.'
  );
}
