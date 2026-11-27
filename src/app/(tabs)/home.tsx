import { kycHref } from '@/components/kyc/navigation';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import { Placeholder } from '@/components/ui/Placeholder';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { TabScreen } from '@/components/ui/TabScreen';
import { Text } from '@/components/ui/Text';
import {
  formatNaira,
  initialsOf,
  KYC_STEPS,
  useAppState,
  type Policy,
} from '@/state/app';
import { colors, fonts, radius, sizes } from '@/theme';
import Feather from '@expo/vector-icons/Feather';
import { useRouter, type Href } from 'expo-router';
import { type ComponentProps, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

const QUICK_ACTIONS: {
  label: string;
  icon: ComponentProps<typeof Feather>['name'];
  href: Href;
}[] = [
  { label: 'Buy cover', icon: 'shield', href: '/insurance' },
  { label: 'My policies', icon: 'file-text', href: '/policies' },
  { label: 'Refer & earn', icon: 'gift', href: '/rewards' },
];

const TIPS = [
  { title: 'What third-party cover actually pays for', readTime: '4 min read' },
  { title: 'Why your BVN speeds up every claim', readTime: '3 min read' },
];

function greetingFor(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const router = useRouter();
  const user = useAppState((state) => state.user);
  const kyc = useAppState((state) => state.kyc);
  const policies = useAppState((state) => state.policies);

  // Stands in for the policies query: the skeleton shows until it "resolves".
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1100);
    return () => clearTimeout(timer);
  }, []);

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <TabScreen>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text
            color="surface"
            style={styles.avatarText}
          >
            {initialsOf(fullName)}
          </Text>
        </View>

        <View style={styles.greeting}>
          <Text
            color="textMuted"
            style={styles.greetingLabel}
          >
            {greetingFor(new Date().getHours())}
          </Text>
          <Text
            style={styles.name}
            numberOfLines={1}
          >
            {user.firstName}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.bell, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Feather
            name="bell"
            size={20}
            color={colors.ink}
          />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      {kyc.status === 'incomplete' ? (
        <Pressable
          onPress={() => router.push(kycHref(kyc.currentStep))}
          style={({ pressed }) => [styles.kycBanner, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Complete your KYC, step ${kyc.currentStep} of ${KYC_STEPS.length}`}
        >
          <View style={styles.kycRow}>
            <View style={styles.kycBadge}>
              <Text style={styles.kycBadgeText}>{kyc.currentStep}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.kycTitle}>
                Complete your KYC to buy insurance
              </Text>
              <Text
                variant="caption"
                color="textMuted"
                style={styles.kycSub}
              >
                Step {kyc.currentStep} of {KYC_STEPS.length} ·{' '}
                {KYC_STEPS[kyc.currentStep - 1]}
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={colors.textFaint}
            />
          </View>
          <ProgressBar progress={kyc.currentStep / KYC_STEPS.length} />
        </Pressable>
      ) : null}

      <View style={styles.quickActions}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => router.navigate(action.href)}
            style={({ pressed }) => [
              styles.quickAction,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Feather
              name={action.icon}
              size={22}
              color={colors.primary}
            />
            <Text
              variant="label"
              style={styles.quickActionLabel}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text variant="sectionH2">Active cover</Text>
        <Pressable
          onPress={() => router.navigate('/policies')}
          hitSlop={12}
          accessibilityRole="button"
        >
          <Text
            variant="label"
            color="primary"
          >
            See all
          </Text>
        </Pressable>
      </View>

      <View style={styles.cover}>
        {loading ? (
          <View style={styles.card}>
            <Skeleton
              width="46%"
              height={14}
            />
            <Skeleton
              width="66%"
              height={30}
              radius={9}
              style={styles.skeletonAmount}
            />
            <Skeleton
              width="80%"
              height={12}
              radius={6}
            />
          </View>
        ) : policies.length === 0 ? (
          <EmptyState
            art={
              <View style={styles.emptyArt}>
                <Placeholder
                  height={88}
                  radius={radius.input}
                  caption="empty-state illustration"
                />
              </View>
            }
            title="You're not covered yet"
            body="Motor cover starts from ₦18,500 a year."
            actionLabel="Browse cover"
            onAction={() => router.navigate('/insurance')}
          />
        ) : (
          <ActiveCoverCard policy={policies[0]} />
        )}
      </View>

      <Text
        variant="sectionH2"
        style={styles.tipsHeading}
      >
        Insurance tips
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Bleeds to the screen edges so cards scroll under the side padding.
        style={styles.tips}
        contentContainerStyle={styles.tipsContent}
      >
        {TIPS.map((tip) => (
          <View
            key={tip.title}
            style={styles.tip}
          >
            <Placeholder
              height={94}
              caption="editorial image"
            />
            <View style={styles.tipBody}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text
                color="textFaint"
                style={styles.tipMeta}
              >
                {tip.readTime}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </TabScreen>
  );
}

function ActiveCoverCard({ policy }: { policy: Policy }) {
  return (
    <View style={styles.card}>
      <View style={styles.coverTop}>
        <Text
          variant="label"
          color="textMuted"
        >
          {policy.name}
        </Text>
        <Pill label="Active" />
      </View>
      <Text variant="policyAmount">{formatNaira(policy.coverAmount)}</Text>
      <Text
        variant="caption"
        color="textMuted"
        style={styles.coverMeta}
      >
        Cover amount · {policy.underwriter}
      </Text>
      <View style={styles.coverColumns}>
        <View style={styles.flex}>
          <Text
            color="textFaint"
            style={styles.columnLabel}
          >
            Next debit
          </Text>
          <Text style={styles.columnValue}>{policy.nextDebit}</Text>
        </View>
        <View style={styles.flex}>
          <Text
            color="textFaint"
            style={styles.columnLabel}
          >
            Premium
          </Text>
          <Text style={styles.columnValue}>
            {formatNaira(policy.premiumMonthly)} / mo
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displaySemi, fontSize: 16, lineHeight: 20 },
  greeting: { flex: 1 },
  greetingLabel: { fontSize: 13, lineHeight: 18 },
  name: { fontFamily: fonts.displaySemi, fontSize: 18, lineHeight: 22 },
  bell: {
    width: sizes.hitArea,
    height: sizes.hitArea,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    // 8pt dot plus the 2pt white ring that separates it from the bell.
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.danger,
  },
  kycBanner: {
    padding: 16,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 18,
  },
  kycRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  kycBadge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kycBadgeText: { fontFamily: fonts.displaySemi, fontSize: 13, lineHeight: 17 },
  kycTitle: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 19 },
  kycSub: { marginTop: 3 },
  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  quickActionLabel: { fontSize: 12, lineHeight: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cover: { marginBottom: 24 },
  card: {
    padding: 18,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  skeletonAmount: { marginTop: 14, marginBottom: 18 },
  emptyArt: { alignSelf: 'stretch', marginBottom: 16 },
  coverTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  coverMeta: { marginTop: 6, marginBottom: 16 },
  coverColumns: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  columnLabel: { fontSize: 11, lineHeight: 15 },
  columnValue: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 },
  tipsHeading: { marginBottom: 12 },
  tips: { marginHorizontal: -sizes.screenPaddingFlow },
  tipsContent: {
    gap: 12,
    paddingHorizontal: sizes.screenPaddingFlow,
    paddingBottom: 8,
  },
  tip: {
    width: 220,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  tipBody: { paddingTop: 12, paddingHorizontal: 14, paddingBottom: 16 },
  tipTitle: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 19 },
  tipMeta: { fontSize: 11, lineHeight: 15, marginTop: 4 },
});
