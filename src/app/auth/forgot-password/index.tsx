import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { colors, sizes } from '@/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const canSubmit = EMAIL_PATTERN.test(email);

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
      >
        <View style={styles.body}>
          <BackButton />

          <View style={styles.intro}>
            <Text variant="authH1">Reset your password</Text>
            <Text
              variant="body"
              color="textMuted"
            >
              Enter the email on your account and we&apos;ll send you a 6-digit
              code.
            </Text>
          </View>

          <Input
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="username"
            autoFocus
          />
        </View>

        <View style={styles.footer}>
          <Button
            title="Send code"
            disabled={!canSubmit}
            // Params carry the address forward so the next screen can show it.
            onPress={() =>
              router.push({
                pathname: '/auth/forgot-password/verify',
                params: { email },
              })
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  body: { flex: 1, paddingHorizontal: sizes.screenPaddingAuth },
  intro: { gap: 8, marginTop: 8, marginBottom: 28 },
  footer: {
    paddingHorizontal: sizes.screenPaddingAuth,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
