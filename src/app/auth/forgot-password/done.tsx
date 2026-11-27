import { Button } from '@/components/ui/Button';
import { SuccessTile } from '@/components/ui/SuccessTile';
import { Text } from '@/components/ui/Text';
import { colors, sizes } from '@/theme';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetDone() {
  const router = useRouter();

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      {/* No back button: the reset is finished, there is nothing to go back to. */}
      <View style={styles.body}>
        <SuccessTile />

        <View style={styles.copy}>
          <Text
            variant="authH1"
            style={styles.centered}
          >
            Password updated
          </Text>
          <Text
            variant="body"
            color="textMuted"
            style={styles.centered}
          >
            You can now log in with your new password.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Back to log in"
          onPress={() => router.replace('/auth/login')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sizes.screenPaddingAuth,
    gap: 24,
  },
  copy: { gap: 8 },
  centered: { textAlign: 'center' },
  footer: {
    paddingHorizontal: sizes.screenPaddingAuth,
    paddingTop: 12,
    paddingBottom: 12,
  },
});
