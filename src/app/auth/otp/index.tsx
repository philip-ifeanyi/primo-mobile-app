import { BackButton } from '@/components/ui/BackButton';
import { CodeInput } from '@/components/ui/CodeInput';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors, fonts, sizes } from '@/theme';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 24;

// Placeholder until the signup form feeds the real number through app state.
const PHONE = '+234 803 412 9087';

export default function Otp() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const isComplete = code.length === CODE_LENGTH;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      <View style={styles.body}>
        <BackButton />

        <View style={styles.intro}>
          <Text variant="authH1">Verify your phone</Text>
          <Text
            variant="body"
            color="textMuted"
          >
            Enter the 6-digit code we sent to{' '}
            <Text
              variant="body"
              color="ink"
              style={styles.phone}
            >
              {PHONE}
            </Text>
            .
          </Text>
        </View>

        <CodeInput
          value={code}
          onChange={setCode}
          length={CODE_LENGTH}
          // A texted code: lets Android autofill it straight from the SMS.
          autoComplete="sms-otp"
        />

        <View style={styles.metaRow}>
          {secondsLeft > 0 ? (
            <Text
              variant="bodySm"
              color="textMuted"
            >
              Resend code in 0:{String(secondsLeft).padStart(2, '0')}
            </Text>
          ) : (
            <Pressable
              onPress={() => setSecondsLeft(RESEND_SECONDS)}
              hitSlop={10}
            >
              <Text
                variant="bodySm"
                color="primary"
              >
                Resend code
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Verify"
          disabled={!isComplete}
          onPress={() => router.push('/auth/biometric')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  body: { flex: 1, paddingHorizontal: sizes.screenPaddingAuth },
  intro: { gap: 8, marginTop: 8, marginBottom: 20 },
  phone: { fontFamily: fonts.bodySemi },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  footer: {
    paddingHorizontal: sizes.screenPaddingAuth,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
