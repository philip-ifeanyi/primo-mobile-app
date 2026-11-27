import { useSyncExternalStore } from 'react';
import { getProfile } from '@/api/auth';
import { setSessionExpiredHandler } from '@/api/client';
import { clearTokens, loadTokens, saveTokens, type Tokens } from '@/api/tokens';
import { setAppState } from './app';

export type SessionStatus =
  /** Reading the keychain on boot; nothing should render over this. */
  | 'restoring'
  | 'signedOut'
  | 'signedIn';

type SessionState = {
  status: SessionStatus;
  /**
   * Set between signing up and verifying the OTP.
   *
   * The tokens are deliberately not applied yet: an unverified account must
   * not be able to reach the signed-in app by backing out of the OTP screen.
   */
  pending: { tokens: Tokens; phone: string } | null;
};

let state: SessionState = { status: 'restoring', pending: null };

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSession<T>(selector: (state: SessionState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}

export function readSession() {
  return state;
}

function set(patch: Partial<SessionState>) {
  state = { ...state, ...patch };
  emit();
}

export const setPending = (pending: SessionState['pending']) =>
  set({ pending });

/**
 * Pulls the signed-in user's name and email into app state.
 *
 * /TokenAuth/Authenticate returns only a token, so the profile is a second
 * call. Failure is swallowed: a profile that will not load is a greeting
 * showing stale text, not a reason to block someone who holds a valid token.
 */
async function loadProfile() {
  try {
    const profile = await getProfile();
    setAppState({
      user: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
      },
    });
  } catch {
    // Left as-is; the request layer has already handled a dead session.
  }
}

/** Called once on boot, before the gate decides where to send the user. */
export async function restoreSession() {
  const tokens = await loadTokens();
  set({ status: tokens ? 'signedIn' : 'signedOut' });

  // Not awaited: the gate should not wait on a profile fetch to route.
  if (tokens) void loadProfile();
}

export async function signIn(tokens: Tokens) {
  await saveTokens(tokens);
  set({ status: 'signedIn', pending: null });
  void loadProfile();
}

export async function signOut() {
  await clearTokens();
  set({ status: 'signedOut', pending: null });
}

/**
 * Lets the HTTP client end the session when a refresh fails, without the api
 * layer having to import app state and create a cycle.
 */
setSessionExpiredHandler(() => {
  set({ status: 'signedOut', pending: null });
});
