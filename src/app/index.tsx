import Introduction from '@/components/intro';
import { useSession } from '@/state/session';
import { Redirect } from 'expo-router';

/**
 * The app's first screen, decided at render time rather than in an effect.
 *
 * An effect would run after the first paint, so a returning user would see a
 * frame of the carousel before being redirected away from it. Returning
 * `<Redirect>` from render means the carousel never mounts for them.
 *
 * `restoring` cannot reach here — the root layout holds the splash until the
 * keychain has been read — so by this point both answers are known.
 */
export default function Index() {
  const status = useSession((state) => state.status);
  const hasSeenIntro = useSession((state) => state.hasSeenIntro);

  if (status === 'signedIn') return <Redirect href="/home" />;

  // Signed out, but this device has been through onboarding before: they
  // have an account, so the login form is the useful screen.
  if (hasSeenIntro) return <Redirect href="/auth/login" />;

  return <Introduction />;
}
