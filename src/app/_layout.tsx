import { restoreSession, useSession } from '@/state/session';
import { fontAssets } from '@/theme';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Hold the native splash until the fonts are in memory, so no screen ever
// renders in the system font and then snaps to Poppins a frame later.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 400, fade: true });

/** Route groups a signed-out visitor is allowed to see. */
const PUBLIC_SEGMENTS = new Set(['auth']);

/**
 * Keeps a signed-out visitor out of the signed-in app.
 *
 * This is the only thing standing between a deep link and the app: without
 * it, primo://home or primo://kyc/3 opens the signed-in app for anyone,
 * because expo-router will happily build that route from a cold start.
 *
 * It deliberately does not bounce a signed-in user off every /auth route.
 * Logging in signs the user in and *then* pushes the biometric prompt, so a
 * blanket rule would race that push and sometimes skip the prompt. The only
 * forward redirect here is off the intro carousel, which nothing navigates to
 * after signing in, so it cannot race anything.
 */
function useAuthGate(isReady: boolean) {
  const router = useRouter();
  const segments = useSegments();
  const status = useSession((state) => state.status);

  useEffect(() => {
    if (!isReady || status === 'restoring') return;

    const first = segments[0];
    // The intro carousel lives at the root route, which has no segment.
    const isIntro = first === undefined;
    const isPublic = isIntro || PUBLIC_SEGMENTS.has(first as string);

    if (status === 'signedOut' && !isPublic) {
      router.replace('/auth/login');
      return;
    }

    // A returning user has no use for the onboarding carousel.
    if (status === 'signedIn' && isIntro) {
      router.replace('/home');
    }
  }, [isReady, status, segments, router]);
}

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);
  const status = useSession((state) => state.status);

  useEffect(() => {
    void restoreSession();
  }, []);

  const isReady = (loaded || error !== null) && status !== 'restoring';

  useAuthGate(isReady);

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  // Fonts still loading, or the keychain not yet read: keep the splash up
  // rather than flashing the intro at someone who is already signed in.
  if (!isReady) return null;

  return (
    // Required for react-native-gesture-handler. expo-router does not add it,
    // and without it pan gestures silently never fire on Android.
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="auth/biometric/index"
            options={{
              // Keeps the previous screen visible behind our own scrim
              // instead of pushing an opaque white card over it.
              presentation: 'transparentModal',
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="kyc-gate"
            options={{ presentation: 'transparentModal', animation: 'fade' }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
