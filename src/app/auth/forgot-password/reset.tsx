import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  PasswordStrength,
  scorePassword,
} from '@/components/ui/PasswordStrength';
import { Text } from '@/components/ui/Text';
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

export default function ResetPassword() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const strength = scorePassword(password);
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = strength >= 2 && confirm === password && password.length > 0;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
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
            <Text variant="authH1">Choose a new password</Text>
            <Text
              variant="body"
              color="textMuted"
            >
              Use at least 8 characters, with a number.
            </Text>
          </View>

          <View style={styles.fields}>
            <View>
              <Input
                label="New password"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                autoFocus
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
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter your password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              error={mismatch ? 'Passwords do not match.' : undefined}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Save password"
            disabled={!canSubmit}
            // replace, not push: the reset form should not be reachable by
            // pressing back from the confirmation.
            onPress={() => router.replace('/auth/forgot-password/done')}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: sizes.screenPaddingAuth, paddingBottom: 24 },
  intro: { gap: 8, marginTop: 8, marginBottom: 28 },
  fields: { gap: 16 },
  footer: {
    paddingHorizontal: sizes.screenPaddingAuth,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
