import * as SecureStore from 'expo-secure-store';

/**
 * The session token, in the device keychain.
 *
 * Not AsyncStorage: that is plain text on disk and readable on a rooted or
 * jailbroken device, and this token is what stands between an attacker and
 * someone's BVN and bank account. (The web portal keeps it in localStorage,
 * which is the browser's equivalent compromise.)
 *
 * One token, not a pair: ABP's /TokenAuth/Authenticate returns an
 * accessToken and an expiry, and the portal uses no refresh endpoint. When
 * the token expires the user logs in again.
 */
const ACCESS_KEY = 'primo.accessToken';
const EXPIRES_KEY = 'primo.accessTokenExpiresAt';
/**
 * Authenticate returns the user's id and nothing else ever does —
 * Profile/GetCurrentUserProfileForEdit gives name, surname and email but no
 * id — so it has to be kept here to survive a restart. VehicleQuote and the
 * admin-scoped endpoints all take it.
 */
const USER_ID_KEY = 'primo.userId';

export type Tokens = {
  accessToken: string;
  /** Epoch milliseconds, derived from ABP's expireInSeconds. */
  expiresAt: number | null;
  /** ABP's user id, as returned by Authenticate. */
  userId: number | null;
};

/**
 * Held in memory as well as the keychain so the request path stays
 * synchronous — every call would otherwise await a keychain read.
 */
let cached: Tokens | null = null;

export function peekTokens() {
  return cached;
}

/** True once the token is past its stated expiry, with a little slack. */
export function isExpired(tokens: Tokens | null, skewMs = 30_000) {
  if (!tokens?.expiresAt) return false;
  return Date.now() + skewMs >= tokens.expiresAt;
}

export async function loadTokens(): Promise<Tokens | null> {
  try {
    const [accessToken, expiresAt, userId] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(EXPIRES_KEY),
      SecureStore.getItemAsync(USER_ID_KEY),
    ]);

    if (!accessToken) {
      cached = null;
      return null;
    }

    const parsed = expiresAt ? Number(expiresAt) : null;
    const parsedUserId = userId ? Number(userId) : null;
    const tokens: Tokens = {
      accessToken,
      expiresAt: Number.isFinite(parsed) ? parsed : null,
      userId: Number.isFinite(parsedUserId) ? parsedUserId : null,
    };

    // An already-expired token is no better than none: treat it as signed out
    // rather than letting the first screen fail with a 401.
    if (isExpired(tokens, 0)) {
      await clearTokens();
      return null;
    }

    cached = tokens;
    return cached;
  } catch {
    // A keychain that cannot be read is the same as being signed out; it must
    // never stop the app from booting.
    cached = null;
    return null;
  }
}

export async function saveTokens(tokens: Tokens) {
  cached = tokens;
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
    tokens.expiresAt === null
      ? SecureStore.deleteItemAsync(EXPIRES_KEY)
      : SecureStore.setItemAsync(EXPIRES_KEY, String(tokens.expiresAt)),
    tokens.userId === null
      ? SecureStore.deleteItemAsync(USER_ID_KEY)
      : SecureStore.setItemAsync(USER_ID_KEY, String(tokens.userId)),
  ]);
}

export async function clearTokens() {
  cached = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(EXPIRES_KEY),
    SecureStore.deleteItemAsync(USER_ID_KEY),
  ]);
}

/** The signed-in user's ABP id, or null when signed out. */
export function peekUserId(): number | null {
  return cached?.userId ?? null;
}
