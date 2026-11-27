import { signUp } from '@/api/auth';
import { messageFor } from '@/api/errors';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import {
  PasswordStrength,
  scorePassword,
} from '@/components/ui/PasswordStrength';
import { StatusRow } from '@/components/ui/StatusRow';
import { Text } from '@/components/ui/Text';
import { setPending } from '@/state/session';
import { colors, fonts, sizes } from '@/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUp() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referral, setReferral] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = scorePassword(password);
  const digits = phone.replace(/\D/g, '');
  const canSubmit =
    EMAIL_PATTERN.test(email) &&
    digits.length === 10 &&
    strength >= 2 &&
    agreed &&
    !isSubmitting;

  const submit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await signUp({
        email: email.trim(),
        password,
        phone: digits,
        referralCode: referral.trim() || undefined,
      });
      // Held, not applied: the account is not verified until the OTP is in.
      setPending({ tokens: result, phone: digits });
      router.push('/auth/otp');
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        // 'padding' on both platforms: Android 15+ (API 35) forces edge-to-edge,
        // where windowSoftInputMode="adjustResize" no longer shifts content for
        // the keyboard, so the app has to consume the IME inset itself.
        behavior="padding"
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackButton />

          <View style={styles.intro}>
            <Text variant="authH1">Create your account</Text>
            <Text
              variant="body"
              color="textMuted"
            >
              Takes about two minutes. You&apos;ll verify your identity next.
            </Text>
          </View>

          <View style={styles.fields}>
            <Input
              label="Email address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
            />

            <Input
              label="Phone number"
              value={phone}
              onChangeText={setPhone}
              placeholder="803 412 9087"
              prefix="+234"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              maxLength={11}
            />

            <View>
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                rightSlot={
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={10}
                    accessibilityRole="button"
                  >
                    <Text
                      variant="label"
                      color="primary"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </Pressable>
                }
              />
              <PasswordStrength score={strength} />
            </View>

            <Input
              label="Referral code (optional)"
              value={referral}
              onChangeText={(next) => setReferral(next.toUpperCase())}
              placeholder="ADA-7K2M"
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.referralInput}
              helper={
                referral ? "Prefilled from Chidi's invite link" : undefined
              }
            />
          </View>

          <View style={styles.terms}>
            <Checkbox
              checked={agreed}
              onChange={setAgreed}
              accessibilityLabel="Agree to terms and privacy policy"
            />
            <Text
              variant="bodySm"
              color="textMuted"
              style={styles.flex}
            >
              I agree to Primo&apos;s{' '}
              <Text
                variant="bodySm"
                color="primary"
              >
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                variant="bodySm"
                color="primary"
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {error ? (
            <StatusRow
              tone="error"
              title={error}
            />
          ) : null}
          <Button
            title="Create account"
            disabled={!canSubmit}
            loading={isSubmitting}
            onPress={() => void submit()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: sizes.screenPaddingAuth,
    paddingBottom: 24,
  },
  intro: { gap: 8, marginTop: 8, marginBottom: 24 },
  fields: { gap: 16 },
  referralInput: {
    fontFamily: fonts.displaySemi,
    letterSpacing: 1.1,
  },
  terms: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 22,
  },
  footer: {
    paddingHorizontal: sizes.screenPaddingAuth,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
