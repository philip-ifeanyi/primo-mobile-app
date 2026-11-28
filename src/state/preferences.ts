import * as SecureStore from 'expo-secure-store';

/**
 * Small device-local flags that outlive a session.
 *
 * These are per-install, not per-account: they describe how this copy of the
 * app behaves, not who is signed in, so signing out must not clear them.
 *
 * SecureStore rather than AsyncStorage because it is already a dependency and
 * adding one would mean another native rebuild. Neither flag is a secret —
 * `biometricEnabled` only says whether to ask for Face ID; the thing actually
 * worth protecting is the token, which lives in the keychain already.
 */
const SEEN_INTRO_KEY = 'primo.hasSeenIntro';
const BIOMETRIC_KEY = 'primo.biometricEnabled';

export type Preferences = {
  /** True once the onboarding carousel has been got through even once. */
  hasSeenIntro: boolean;
  /** True once the user has turned on unlock-with-biometrics. */
  biometricEnabled: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  hasSeenIntro: false,
  biometricEnabled: false,
};

async function readFlag(key: string): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(key)) === 'true';
  } catch {
    // A keychain that cannot be read must never stop the app booting. The
    // cost of guessing wrong here is one extra look at the carousel.
    return false;
  }
}

async function writeFlag(key: string, value: boolean): Promise<void> {
  try {
    if (value) await SecureStore.setItemAsync(key, 'true');
    else await SecureStore.deleteItemAsync(key);
  } catch {
    // Same reasoning: a preference that will not persist is a small
    // annoyance next launch, not an error worth surfacing.
  }
}

export async function loadPreferences(): Promise<Preferences> {
  const [hasSeenIntro, biometricEnabled] = await Promise.all([
    readFlag(SEEN_INTRO_KEY),
    readFlag(BIOMETRIC_KEY),
  ]);
  return { hasSeenIntro, biometricEnabled };
}

export const persistSeenIntro = () => writeFlag(SEEN_INTRO_KEY, true);

export const persistBiometricEnabled = (enabled: boolean) =>
  writeFlag(BIOMETRIC_KEY, enabled);
