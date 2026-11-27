import { sendOtp, verifyOtp } from '@/api/auth';
import { messageFor } from '@/api/errors';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { CodeInput } from '@/components/ui/CodeInput';
import { StatusRow } from '@/components/ui/StatusRow';
import { Text } from '@/components/ui/Text';
import { signIn, useSession } from '@/state/session';
import { colors, fonts, sizes } from '@/theme';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 24;

/** "8034129087" -> "+234 803 412 9087". */
function formatPhone(digits: string) {
  const parts = digits.match(/^(\d{3})(\d{3})(\d{4})$/);
  return parts ? `+234 ${parts[1]} ${parts[2]} ${parts[3]}` : `+234 ${digits}`;
}

export default function Otp() {
  const router = useRouter();
  const pending = useSession((state) => state.pending);

  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Reached without signing up — there is no number to verify against.
  if (!pending) return <Redirect href="/auth/signup" />;

  const isComplete = code.length === CODE_LENGTH && !isSubmitting;

  const submit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await verifyOtp(pending.phone, code);
      // Only now does the account become a session.
      await signIn(pending.tokens);
      router.replace('/auth/biometric');
    } catch (cause) {
      setError(messageFor(cause));
      setCode('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resend = async () => {
    setSecondsLeft(RESEND_SECONDS);
    setError(null);
    try {
      await sendOtp(pending.phone);
    } catch (cause) {
      setError(messageFor(cause));
    }
  };

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
              {formatPhone(pending.phone)}
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
              onPress={() => void resend()}
              hitSlop={10}
              accessibilityRole="button"
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
        {error ? (
          <StatusRow
            tone="error"
            title={error}
          />
        ) : null}
        <Button
          title="Verify"
          disabled={!isComplete}
          loading={isSubmitting}
          onPress={() => void submit()}
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
