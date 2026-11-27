import { Button } from '@/components/ui/Button';
import { SuccessTile } from '@/components/ui/SuccessTile';
import { Text } from '@/components/ui/Text';
import { clearQuote, useAppState } from '@/state/app';
import { colors, fonts, radius, sizes } from '@/theme';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Success() {
  const router = useRouter();
  const { policyNumber, nextDebit } = useLocalSearchParams<{
    policyNumber: string;
    nextDebit?: string;
  }>();

  // The certificate lives on the issued policy, not in the route params, so
  // that a deep link to this screen cannot fabricate one.
  const documentUrl = useAppState(
    (state) =>
      state.policies.find((policy) => policy.policyNumber === policyNumber)
        ?.documentUrl ?? null
  );

  // The policy is issued and in state; the quote that produced it is spent.
  // Clearing it also disarms the Pay button behind this screen.
  useEffect(() => {
    clearQuote();
  }, []);

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      <View style={styles.body}>
        <SuccessTile />

        <Text
          variant="authH1"
          style={styles.title}
        >
          You&apos;re covered
        </Text>
        <Text
          color="textMuted"
          style={styles.copy}
        >
          Policy {policyNumber} is active from today.
          {nextDebit ? ` Your next debit is ${nextDebit}.` : ''}
        </Text>

        <View style={styles.certificate}>
          {/* The real PDF arrives with the policy documents endpoint. */}
          <View style={styles.thumb}>
            <Feather
              name="file-text"
              size={18}
              color={colors.textMuted}
            />
          </View>

          <View style={styles.certificateCopy}>
            <Text style={styles.certificateTitle}>
              Certificate of insurance
            </Text>
            <Text
              variant="caption"
              color="textMuted"
            >
              PDF · 248 KB
            </Text>
          </View>

          <Pressable
            hitSlop={12}
            accessibilityRole="button"
            disabled={!documentUrl}
            onPress={() => {
              if (!documentUrl) return;
              // Share the URL rather than the file: the certificate is served
              // by the backend and has not been downloaded to the device.
              void Share.share({ url: documentUrl, message: documentUrl }).catch(
                () => Alert.alert('Could not share', 'Please try again.')
              );
            }}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Text
              variant="label"
              color={documentUrl ? 'primary' : 'textFaint'}
            >
              Share
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="View policy"
          onPress={() => router.replace('/policies')}
        />
        <Button
          title="Back to home"
          variant="text"
          onPress={() => router.replace('/home')}
          textStyle={styles.secondary}
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
  },
  title: { textAlign: 'center', marginTop: 24, marginBottom: 10 },
  copy: {
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 290,
    marginBottom: 20,
  },
  certificate: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 16,
  },
  thumb: {
    width: 40,
    height: 48,
    borderRadius: radius.thumb,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certificateCopy: { flex: 1 },
  certificateTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    lineHeight: 19,
  },
  pressed: { opacity: 0.6 },
  actions: {
    paddingHorizontal: sizes.screenPaddingAuth,
    paddingBottom: 12,
    gap: 4,
  },
  secondary: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textMuted,
  },
});
