import { FlowHeader } from '@/components/buy/FlowHeader';
import { kycHref } from '@/components/kyc/navigation';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import { formatNaira, KYC_STEPS, startQuote, useAppState } from '@/state/app';
import { loadProducts, productsFor, useCatalogue } from '@/state/buy-service';
import { colors, fonts, radius, sizes } from '@/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Only Motor has a priced catalogue in this batch. */
const CATEGORY_NAMES: Record<string, string> = {
  motor: 'Motor',
  health: 'Health & Life',
  travel: 'Travel',
  home: 'Home',
  savings: 'Savings',
  education: 'Education',
};

export default function ProductList() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();

  const kyc = useAppState((state) => state.kyc);

  const title = CATEGORY_NAMES[category] ?? 'Insurance';

  // Subscribed, because the catalogue is fetched: the first render shows the
  // fixtures and the real products replace them when they arrive.
  const products = useCatalogue(() => productsFor(category));

  useEffect(() => {
    void loadProducts(category);
  }, [category]);
  // The insurance tiles check this too, but a deep link reaches this route
  // without passing them, and the rule is that no purchase may start before
  // KYC is approved. Blocking in place rather than redirecting: bouncing to
  // the gate sheet would send its "Not now" straight back here.
  const isGated = kyc.status !== 'approved';

  const underwriters = new Set(products.map((product) => product.underwriter));

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      <FlowHeader
        title={title}
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {isGated ? (
          <EmptyState
            title="Finish KYC to buy cover"
            body={`Regulation requires us to verify your identity before a policy can be issued. You're on step ${kyc.currentStep} of ${KYC_STEPS.length}.`}
            actionLabel="Continue KYC"
            onAction={() => router.replace(kycHref(kyc.currentStep))}
          />
        ) : products.length === 0 ? (
          <EmptyState
            title={`${title} cover is on the way`}
            body="We're still signing underwriters for this category. Motor cover is available today."
            actionLabel="See Motor cover"
            onAction={() => router.replace('/buy/motor')}
          />
        ) : (
          <>
            <Text
              variant="caption"
              color="textMuted"
              style={styles.count}
            >
              {products.length}{' '}
              {products.length === 1 ? 'product' : 'products'} from{' '}
              {underwriters.size}{' '}
              {underwriters.size === 1 ? 'underwriter' : 'underwriters'}
            </Text>

            {products.map((product) => (
              <Pressable
                key={product.id}
                onPress={() => {
                  // Drops anything left from a previous quote.
                  startQuote(product.id);
                  router.push('/buy/quote');
                }}
                accessibilityRole="button"
                accessibilityLabel={`${product.name} by ${product.underwriter}, ${formatNaira(product.premiumMonthly)} a month`}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.flex}>
                    <Text style={styles.name}>{product.name}</Text>
                    <Text
                      variant="caption"
                      color="textMuted"
                    >
                      {product.underwriter}
                    </Text>
                  </View>
                  {product.popular ? (
                    <Pill
                      label="Popular"
                      tone="neutral"
                    />
                  ) : null}
                </View>

                <Text
                  variant="caption"
                  color="textMuted"
                  style={styles.description}
                >
                  {product.description}
                </Text>

                <View style={styles.priceRow}>
                  <Text variant="productPrice">
                    {formatNaira(product.premiumMonthly)}
                  </Text>
                  <Text
                    variant="caption"
                    color="textMuted"
                  >
                    / month
                  </Text>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.canvas },
  body: {
    paddingTop: 18,
    paddingHorizontal: sizes.screenPaddingFlow,
    paddingBottom: 32,
  },
  count: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.cardLg,
    backgroundColor: colors.surface,
    padding: 18,
    marginBottom: 12,
  },
  pressed: { opacity: 0.85 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  name: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 22 },
  description: { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
});
