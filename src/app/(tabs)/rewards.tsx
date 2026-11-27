import { Pill } from '@/components/ui/Pill';
import { TabScreen } from '@/components/ui/TabScreen';
import { Text } from '@/components/ui/Text';
import { formatNaira, initialsOf, useAppState } from '@/state/app';
import { colors, fonts, radius } from '@/theme';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';

const COPIED_MS = 1600;

export default function Rewards() {
  const referrals = useAppState((state) => state.referrals);
  const [copied, setCopied] = useState(false);

  // Flip "Copied" back to "Copy" after a beat; cleared if the tab unmounts first.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(referrals.code);
    setCopied(true);
  };

  const handleShare = () => {
    // Rejects only if the share sheet itself fails to open; nothing to recover.
    Share.share({
      message: `Get insured on Primo with my code ${referrals.code} and we both earn ₦2,000.`,
    }).catch(() => {});
  };

  const stats = [
    { label: 'Total', value: String(referrals.stats.total) },
    { label: 'Pending', value: String(referrals.stats.pending) },
    { label: 'Paid', value: referrals.stats.paid },
  ];

  return (
    <TabScreen>
      <Text variant="tabH1">Rewards</Text>

      <View style={styles.hero}>
        <Text
          color="surface"
          style={styles.heroTitle}
        >
          Refer friends and earn ₦2,000
        </Text>
        <Text
          color="surface"
          style={styles.heroBody}
        >
          Paid when they buy their first policy.
        </Text>

        <View style={styles.codeRow}>
          <Text
            color="surface"
            style={styles.code}
            selectable
          >
            {referrals.code}
          </Text>
          <Pressable
            onPress={handleShare}
            hitSlop={8}
            style={({ pressed }) => [
              styles.codeButton,
              styles.shareButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text
              color="surface"
              style={styles.codeButtonText}
            >
              Share
            </Text>
          </Pressable>
          <Pressable
            onPress={handleCopy}
            hitSlop={8}
            style={({ pressed }) => [
              styles.codeButton,
              styles.copyButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={copied ? 'Copied' : 'Copy referral code'}
          >
            <Text
              color="primaryDeep"
              style={styles.codeButtonText}
            >
              {copied ? 'Copied' : 'Copy'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.stats}>
        {stats.map((stat) => (
          <View
            key={stat.label}
            style={styles.stat}
          >
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text
              color="textMuted"
              style={styles.statLabel}
            >
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.list}>
        {referrals.list.map((referral, index) => (
          <View
            key={referral.id}
            style={[styles.row, index > 0 && styles.rowDivider]}
          >
            <View style={styles.rowAvatar}>
              <Text style={styles.rowInitials}>{initialsOf(referral.name)}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowName}>{referral.name}</Text>
              <Text
                color="textFaint"
                style={styles.rowMeta}
              >
                {referral.meta}
              </Text>
            </View>
            {referral.amount === null ? (
              <Pill
                label="Pending"
                tone="accent"
              />
            ) : (
              <Text style={styles.rowAmount}>{formatNaira(referral.amount)}</Text>
            )}
          </View>
        ))}
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  hero: {
    padding: 22,
    borderRadius: radius.hero,
    backgroundColor: colors.primaryDeep,
    marginTop: 16,
    marginBottom: 18,
  },
  heroTitle: { fontFamily: fonts.displaySemi, fontSize: 22, lineHeight: 28 },
  heroBody: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.85,
    marginTop: 8,
    marginBottom: 18,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.input,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  code: {
    flex: 1,
    fontFamily: fonts.displaySemi,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 1.8,
  },
  codeButton: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  copyButton: {
    backgroundColor: colors.surface,
    borderColor: colors.surface,
  },
  shareButton: { borderColor: 'rgba(255,255,255,0.4)' },
  codeButtonText: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 16 },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  stat: {
    flex: 1,
    padding: 14,
    borderRadius: radius.button,
    backgroundColor: colors.field,
  },
  statValue: { fontFamily: fonts.displaySemi, fontSize: 22, lineHeight: 28 },
  statLabel: { fontSize: 11, lineHeight: 15 },
  list: {
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  rowAvatar: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInitials: { fontFamily: fonts.displaySemi, fontSize: 13, lineHeight: 17 },
  rowName: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 },
  rowMeta: { fontSize: 11, lineHeight: 15 },
  rowAmount: { fontFamily: fonts.displaySemi, fontSize: 14, lineHeight: 18 },
});
