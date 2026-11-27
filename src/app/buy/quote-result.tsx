import { FlowFooter } from '@/components/buy/FlowFooter';
import { FlowHeader } from '@/components/buy/FlowHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { formatNaira, useAppState } from '@/state/app';
import { formatShortDate } from '@/state/dates';
import { colors, fonts, radius, sizes } from '@/theme';
import { Redirect, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QuoteResult() {
  const router = useRouter();
  const result = useAppState((state) => state.quote.result);

  // No premium means the pricing step was skipped or the quote was reset.
  if (!result) return <Redirect href="/buy/motor" />;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      <FlowHeader
        title="Your quote"
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text
            variant="caption"
            color="textMuted"
            style={styles.heroLabel}
          >
            Your premium
          </Text>
          <Text variant="premiumHero">
            {formatNaira(result.premiumYearly)}
          </Text>
          <Text
            variant="caption"
            color="textMuted"
            style={styles.heroSub}
          >
            per year · or {formatNaira(result.premiumMonthly)} monthly by direct
            debit
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What&apos;s covered</Text>

          {result.cover.map((line, index) => (
            <View
              key={line.label}
              style={[
                styles.coverRow,
                index < result.cover.length - 1 && styles.coverRowDivided,
              ]}
            >
              <Text
                variant="bodySm"
                color="textMuted"
              >
                {line.label}
              </Text>
              <Text style={styles.coverValue}>{line.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.meta}>
          <Text
            variant="caption"
            color="textFaint"
          >
            Quote #{result.quoteId}
          </Text>
          <Text
            variant="caption"
            color="textFaint"
          >
            Valid until {formatShortDate(result.validUntil)}
          </Text>
        </View>
      </ScrollView>

      <FlowFooter>
        <Button
          title="Continue to checkout"
          onPress={() => router.push('/buy/checkout')}
        />
      </FlowFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  body: {
    paddingTop: 22,
    paddingHorizontal: sizes.screenPaddingFlow,
    paddingBottom: 24,
  },
  hero: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.hero,
    backgroundColor: colors.surface,
    padding: 24,
    marginBottom: 14,
  },
  heroLabel: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  heroSub: { fontSize: 13, lineHeight: 18, marginTop: 8, textAlign: 'center' },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.cardLg,
    backgroundColor: colors.surface,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 14,
  },
  coverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 9,
  },
  coverRowDivided: {
    borderBottomWidth: 1,
    borderBottomColor: colors.field,
  },
  coverValue: {
    fontFamily: fonts.displayMedium,
    fontSize: 14,
    lineHeight: 19,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
});
