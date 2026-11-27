import type { Href } from 'expo-router';

/**
 * Href for a wizard step.
 *
 * The object form rather than a template string: `/kyc/[step]` is a dynamic
 * route, and with typedRoutes turned on this is the shape expo-router can
 * actually check.
 */
export function kycHref(step: number): Href {
  return { pathname: '/kyc/[step]', params: { step: String(step) } };
}
