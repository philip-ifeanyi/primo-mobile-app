import { logIn } from '@/api/auth';
import { messageFor } from '@/api/errors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusRow } from '@/components/ui/StatusRow';
import { Text } from '@/components/ui/Text';
import { Wordmark } from '@/components/ui/Wordmark';
import { signIn } from '@/state/session';
import { colors, sizes } from '@/theme';
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

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    EMAIL_PATTERN.test(email) && password.length > 0 && !isSubmitting;

  const submit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await logIn({ email: email.trim(), password });
      // Applies the tokens, which flips the gate to signed in.
      await signIn(result);
      router.replace('/auth/biometric');
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
        <Wordmark
          fontSize={22}
          style={styles.wordmark}
        />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <Text variant="authH1">Welcome back</Text>
            <Text
              variant="body"
              color="textMuted"
            >
              Log in to manage your cover.
            </Text>
          </View>

          <View style={styles.fields}>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="username"
            />

            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
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
          </View>

          <Pressable
            onPress={() => router.push('/auth/forgot-password')}
            hitSlop={10}
            style={styles.forgotRow}
            accessibilityRole="button"
          >
            <Text
              variant="label"
              color="primary"
            >
              Forgot password?
            </Text>
          </Pressable>

          {error ? (
            <StatusRow
              tone="error"
              title={error}
            />
          ) : null}

          <View style={styles.actions}>
            <Button
              title="Log in"
              disabled={!canSubmit}
              loading={isSubmitting}
              onPress={() => void submit()}
            />
            <Button
              title="Create an account"
              variant="outline"
              onPress={() => router.push('/auth/signup')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  wordmark: {
    paddingHorizontal: sizes.screenPaddingAuth,
    paddingVertical: 12,
  },
  scroll: {
    flexGrow: 1,
    // Spec: the block sits vertically centred between wordmark and bottom.
    justifyContent: 'center',
    paddingHorizontal: sizes.screenPaddingAuth,
    paddingBottom: 24,
  },
  intro: { gap: 8, marginBottom: 24 },
  fields: { gap: 12 },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: 14,
  },
  actions: { gap: 12, marginTop: 24 },
});
