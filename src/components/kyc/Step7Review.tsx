import { Text } from '@/components/ui/Text';
import { Toggle } from '@/components/ui/Toggle';
import { setKyc, useAppState } from '@/state/app';
import { colors, fonts, radius } from '@/theme';
import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

export function Step7Review() {
  const notificationsOptIn = useAppState(
    (state) => state.kyc.notificationsOptIn
  );

  return (
    <View style={styles.body}>
      <View style={styles.clock}>
        <Feather
          name="clock"
          size={34}
          color={colors.ink}
        />
      </View>

      <Text
        variant="stepH1"
        style={styles.title}
      >
        We&apos;re reviewing your details
      </Text>
      <Text
        variant="bodySm"
        color="textMuted"
        style={styles.copy}
      >
        Approval usually lands within 24 hours. We&apos;ll push you a
        notification the moment it does — no need to keep the app open.
      </Text>

      <View style={styles.optIn}>
        <View style={styles.optInIcon}>
          <Feather
            name="bell"
            size={18}
            color={colors.ink}
          />
        </View>

        <View style={styles.optInCopy}>
          <Text style={styles.optInTitle}>Turn on notifications</Text>
          <Text
            variant="caption"
            color="textMuted"
          >
            So you hear the second you&apos;re approved
          </Text>
        </View>

        <Toggle
          value={notificationsOptIn}
          accessibilityLabel="Turn on notifications"
          // TODO: ask for the OS permission here once expo-notifications is in.
          onChange={(next) => setKyc({ notificationsOptIn: next })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 40, alignItems: 'center' },
  clock: {
    width: 84,
    height: 84,
    borderRadius: radius.sheet,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  title: { textAlign: 'center', marginBottom: 10 },
  copy: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: 24,
  },
  optIn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 16,
  },
  optInIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optInCopy: { flex: 1 },
  optInTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    lineHeight: 19,
  },
});
