import { logOut } from '@/api/auth';
import { kycHref } from '@/components/kyc/navigation';
import { Pill } from '@/components/ui/Pill';
import { TabScreen } from '@/components/ui/TabScreen';
import { Text } from '@/components/ui/Text';
import { initialsOf, KYC_STEPS, useAppState } from '@/state/app';
import { signOut } from '@/state/session';
import { colors, fonts, radius } from '@/theme';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

export default function More() {
  const router = useRouter();
  const user = useAppState((state) => state.user);
  const kyc = useAppState((state) => state.kyc);

  const fullName = `${user.firstName} ${user.lastName}`;

  // TODO: Beneficiaries, Notifications, Security and Support have no designs
  // in this batch, so they are inert rows for now.
  const rows: { label: string; onPress?: () => void; danger?: boolean }[] = [
    {
      label: 'Verifications',
      onPress: () => router.push(kycHref(kyc.currentStep)),
    },
    { label: 'Beneficiaries' },
    { label: 'Notifications' },
    { label: 'Security' },
    { label: 'Support' },
    {
      label: 'Log out',
      danger: true,
      // Revoke server-side first, then drop the local tokens. The auth gate
      // sees the session end and sends the user to login, so there is no
      // navigation here to get out of step with the session.
      onPress: () => {
        void logOut().finally(() => void signOut());
      },
    },
  ];

  return (
    <TabScreen>
      <Text variant="tabH1">More</Text>

      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text
            color="surface"
            style={styles.avatarText}
          >
            {initialsOf(fullName)}
          </Text>
        </View>
        <View style={styles.flex}>
          <Text
            style={styles.name}
            numberOfLines={1}
          >
            {fullName}
          </Text>
          <Text
            variant="caption"
            color="textMuted"
            numberOfLines={1}
          >
            {user.email}
          </Text>
        </View>
        {kyc.status === 'approved' ? (
          <Pill label="Verified" />
        ) : (
          <Pill
            label={`KYC ${kyc.currentStep}/${KYC_STEPS.length}`}
            tone="accent"
          />
        )}
      </View>

      <View style={styles.group}>
        {rows.map((row, index) => (
          <Pressable
            key={row.label}
            onPress={row.onPress}
            style={({ pressed }) => [
              styles.row,
              index > 0 && styles.rowDivider,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text
              color={row.danger ? 'danger' : 'ink'}
              style={styles.rowLabel}
            >
              {row.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text
        color="textFaint"
        style={styles.version}
      >
        Primo v{Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { backgroundColor: colors.canvas },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginTop: 16,
    marginBottom: 18,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displaySemi, fontSize: 18, lineHeight: 22 },
  name: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 22 },
  group: {
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  row: { padding: 16 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  rowLabel: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 21 },
  version: { fontSize: 11, lineHeight: 15, textAlign: 'center', marginTop: 16 },
});
