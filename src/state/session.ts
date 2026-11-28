import { useSyncExternalStore } from 'react';
import { getProfile } from '@/api/auth';
import { setSessionExpiredHandler } from '@/api/client';
import { clearTokens, loadTokens, saveTokens, type Tokens } from '@/api/tokens';
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  persistBiometricEnabled,
  persistSeenIntro,
} from './preferences';
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
  /**
   * Whether the onboarding carousel has been seen on this device. Someone who
   * already has an account should land on the login form, not on "Cover that
   * fits in your pocket" again.
   */
  hasSeenIntro: boolean;
  /** Whether the user asked to unlock with Face ID / fingerprint. */
  biometricEnabled: boolean;
  /**
   * True when a restored session is waiting behind the biometric prompt.
   *
   * This is the difference between enrolling in biometrics and actually being
   * protected by them: the token is valid, but nothing signed-in renders
   * until the device confirms who is holding the phone. It starts true on
   * boot whenever both a session and the preference exist, and no route can
   * clear it, because the lock is rendered in place of the whole navigator
   * rather than being a screen that something could navigate past.
   */
  locked: boolean;
};

let state: SessionState = {
  status: 'restoring',
  pending: null,
  ...DEFAULT_PREFERENCES,
  locked: false,
};

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
  // Both are needed before anything renders: the preferences decide whether
  // the carousel or the lock screen is the right first frame.
  const [tokens, preferences] = await Promise.all([
    loadTokens(),
    loadPreferences(),
  ]);

  set({
    status: tokens ? 'signedIn' : 'signedOut',
    ...preferences,
    // Only a restored session locks. Signing in within this launch has just
    // proved who the user is, so re-prompting there would be theatre.
    locked: Boolean(tokens) && preferences.biometricEnabled,
  });

  // Not awaited: the gate should not wait on a profile fetch to route.
  if (tokens) void loadProfile();
}

/** Marks the carousel as seen, so later launches skip straight to login. */
export function markIntroSeen() {
  if (state.hasSeenIntro) return;
  set({ hasSeenIntro: true });
  void persistSeenIntro();
}

/** Records the user's choice on the biometric prompt. */
export function setBiometricEnabled(enabled: boolean) {
  set({ biometricEnabled: enabled });
  void persistBiometricEnabled(enabled);
}

/** Called once the device has confirmed the holder at launch. */
export const unlock = () => set({ locked: false });

export async function signIn(tokens: Tokens) {
  await saveTokens(tokens);
  // Not locked: the password just established who this is.
  set({ status: 'signedIn', pending: null, locked: false });
  void loadProfile();
}

export async function signOut() {
  await clearTokens();
  // hasSeenIntro and biometricEnabled are deliberately untouched: they
  // describe the device, not the session, and someone signing out has
  // certainly still seen the carousel.
  set({ status: 'signedOut', pending: null, locked: false });
}

/**
 * Lets the HTTP client end the session when a refresh fails, without the api
 * layer having to import app state and create a cycle.
 */
setSessionExpiredHandler(() => {
  set({ status: 'signedOut', pending: null, locked: false });
});
