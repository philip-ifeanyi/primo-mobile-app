import { FlowFooter } from '@/components/buy/FlowFooter';
import { FlowHeader } from '@/components/buy/FlowHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import {
  formatNaira,
  setQuote,
  useAppState,
  type PaymentFrequency,
} from '@/state/app';
import { amountDue, productById } from '@/state/buy-service';
import { colors, fonts, radius, sizes } from '@/theme';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Checkout() {
  const router = useRouter();
  const quote = useAppState((state) => state.quote);
  const user = useAppState((state) => state.user);
  const product = productById(quote.productId);

  if (!product || !quote.result) return <Redirect href="/buy/motor" />;

  const { result, vehicle, frequency } = quote;
  const total = amountDue(result, frequency);

  const options: {
    key: PaymentFrequency;
    title: string;
    detail: string;
  }[] = [
    {
      key: 'monthly',
      title: 'Monthly',
      detail: `${formatNaira(result.premiumMonthly)} direct debit`,
    },
    {
      key: 'one_off',
      title: 'One-off',
      detail: `${formatNaira(result.premiumYearly)} today`,
    },
  ];

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      <FlowHeader
        title={`Confirm order #${result.quoteId}`}
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text
            variant="caption"
            color="textMuted"
            style={styles.underwriter}
          >
            {product.underwriter} · {product.code}
          </Text>

          <View style={styles.summaryRow}>
            <Text
              variant="bodySm"
              color="textMuted"
            >
              {vehicle.make} {vehicle.model} {vehicle.year}
            </Text>
            <Text style={styles.summaryValue}>{vehicle.colour}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text
              variant="bodySm"
              color="textMuted"
            >
              Policyholder
            </Text>
            <Text style={styles.summaryValue}>
              {user.firstName} {user.lastName}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment frequency</Text>

          <View style={styles.options}>
            {options.map((option) => {
              const isSelected = option.key === frequency;

              return (
                <Pressable
                  key={option.key}
                  onPress={() => setQuote({ frequency: option.key })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => [
                    styles.option,
                    isSelected && styles.optionSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text
                    variant="caption"
                    color="textMuted"
                    style={styles.optionDetail}
                  >
                    {option.detail}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, styles.totalCard]}>
          <Text style={styles.totalLabel}>Total premium</Text>
          <Text style={styles.totalValue}>{formatNaira(total)}</Text>
        </View>
      </ScrollView>

      <FlowFooter row>
        <Button
          title="Back"
          variant="outline"
          fullWidth={false}
          onPress={() => router.back()}
          style={styles.backButton}
          textStyle={styles.backLabel}
        />
        <Button
          title={`Pay ${formatNaira(total)}`}
          style={styles.flex}
          onPress={() => router.push('/buy/payment')}
        />
      </FlowFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.canvas },
  body: {
    paddingTop: 18,
    paddingHorizontal: sizes.screenPaddingFlow,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.cardLg,
    backgroundColor: colors.surface,
    padding: 18,
    marginBottom: 14,
  },
  productName: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 20 },
  underwriter: { marginTop: 4, marginBottom: 14 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  summaryValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 19,
  },
  cardTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 12,
  },
  options: { flexDirection: 'row', gap: 10 },
  option: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: 14,
  },
  optionSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    // Absorbs the extra border so the card does not resize on selection.
    padding: 13,
  },
  optionTitle: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 19 },
  optionDetail: { marginTop: 3 },
  pressed: { opacity: 0.85 },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  totalLabel: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 20 },
  totalValue: {
    fontFamily: fonts.displaySemi,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.48,
  },
  backButton: { width: 96 },
  backLabel: { fontSize: 15, color: colors.ink },
});
