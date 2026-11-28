import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Wordmark } from '@/components/ui/Wordmark';
import { signOut, unlock } from '@/state/session';
import { colors, radius } from '@/theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * The launch gate for a restored session.
 *
 * This is rendered *instead of* the navigator, not as a route inside it.
 * That matters: a lock that is a screen can be navigated past — by a deep
 * link, by a stale back stack, by anything that calls replace() — whereas a
 * lock that replaces the navigator has nothing behind it to reach. The
 * signed-in app is not mounted at all until `unlock()` is called.
 *
 * Failing is not the same as signing out. The token is still valid, so a
 * failed or cancelled prompt leaves the user here with the option to try
 * again; "Use password instead" is the deliberate way out, and that does
 * sign them out so the password is actually required.
 */
export function LockScreen() {
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hasFace, setHasFace] = useState(Platform.OS === 'ios');

  // Strict mode double-invokes effects, and a second prompt while the first
  // is open throws on iOS.
  const prompting = useRef(false);

  useEffect(() => {
    let cancelled = false;
    LocalAuthentication.supportedAuthenticationTypesAsync().then((types) => {
      if (cancelled) return;
      setHasFace(
        types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const method = hasFace
    ? Platform.OS === 'ios'
      ? 'Face ID'
      : 'Face Unlock'
    : 'Fingerprint';

  const prompt = useCallback(async () => {
    if (prompting.current) return;
    prompting.current = true;

    try {
      // Awaited before any setState, so that the auto-prompt below is not
      // setting state synchronously inside an effect — which React flags as
      // a cascading render. These two checks are device-local and fast, so
      // nothing is visibly delayed by ordering it this way.
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);

      setChecking(true);

      // Biometrics were turned on, then removed from the device. Locking
      // someone out of their own app over that would be absurd, and the
      // token is still valid, so let them in and stop asking.
      if (!hasHardware || !isEnrolled) {
        unlock();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Primo',
        cancelLabel: 'Use password instead',
        disableDeviceFallback: false,
      });

      if (result.success) unlock();
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      prompting.current = false;
      setChecking(false);
    }
  }, []);

  // Prompt as soon as the lock appears, so the common case is one glance
  // rather than a tap and then a glance.
  //
  // The rule below fires because `prompt` contains setState and is called
  // from an effect. It cannot see that every setState in there happens after
  // an await, so none of them runs synchronously during this effect and no
  // cascading render is possible. Kept rather than restructured because
  // prompting on appear is the whole point of the screen.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void prompt();
  }, [prompt]);

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      <View style={styles.header}>
        <Wordmark />
      </View>

      <View style={styles.body}>
        <View style={styles.iconTile}>
          <MaterialCommunityIcons
            name={hasFace ? 'face-recognition' : 'fingerprint'}
            size={34}
            color={colors.primary}
          />
        </View>

        <Text
          variant="sectionH2"
          style={styles.title}
        >
          Welcome back
        </Text>

        <Text
          variant="bodySm"
          color="textMuted"
          style={styles.subtitle}
        >
          {failed
            ? `We couldn't confirm it was you. Try ${method} again, or use your password.`
            : `Unlock with ${method} to continue.`}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title={failed ? `Try ${method} again` : `Unlock with ${method}`}
          loading={checking}
          onPress={() => void prompt()}
          fullWidth
        />
        <Button
          title="Use password instead"
          variant="text"
          onPress={() => void signOut()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: 20 },
  header: { paddingTop: 8 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconTile: {
    width: 76,
    height: 76,
    borderRadius: radius.hero,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 22, lineHeight: 27, textAlign: 'center' },
  subtitle: { textAlign: 'center', marginTop: 8, paddingHorizontal: 16 },
  actions: { gap: 4, paddingBottom: 8 },
});
