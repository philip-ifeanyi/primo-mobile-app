import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors, radius } from '@/theme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { setBiometricEnabled } from '@/state/session';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export default function Biometric() {
  const router = useRouter();
  const [enabling, setEnabling] = useState(false);
  // Default to the platform convention, then refine once the device answers.
  const [hasFace, setHasFace] = useState(Platform.OS === 'ios');

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

  // Unwind the whole auth stack first so back from Home can never land on
  // the login form, then swap the remaining root screen for the tab shell.
  const goHome = () => {
    router.dismissAll();
    router.replace('/home');
  };

  const decline = () => {
    // Recorded explicitly rather than left unset, so a later launch does not
    // keep asking someone who has already said no.
    setBiometricEnabled(false);
    goHome();
  };

  const handleEnable = async () => {
    setEnabling(true);
    try {
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);

      // No sensor, or nothing enrolled: nothing to turn on, so just continue.
      if (!hasHardware || !isEnrolled) {
        setBiometricEnabled(false);
        goHome();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Unlock Primo with ${method}`,
        cancelLabel: 'Not now',
      });

      // A failed or cancelled prompt leaves the sheet up rather than
      // enabling something that was never confirmed.
      if (result.success) {
        setBiometricEnabled(true);
        goHome();
      }
    } finally {
      setEnabling(false);
    }
  };

  return (
    <BottomSheet onDismiss={decline}>
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
        Unlock Primo with {method}?
      </Text>

      <Text
        variant="bodySm"
        color="textMuted"
        style={styles.body}
      >
        Next time you open Primo, unlock with {method} instead of typing your
        password.
      </Text>

      <View style={styles.actions}>
        <Button
          title={`Enable ${method}`}
          loading={enabling}
          onPress={handleEnable}
        />
        <Button
          title="Not now"
          variant="text"
          onPress={decline}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  iconTile: {
    width: 76,
    height: 76,
    borderRadius: radius.hero,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    lineHeight: 27,
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    marginTop: 22,
    gap: 4,
  },
});
