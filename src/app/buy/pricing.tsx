import { Loading } from '@/components/buy/Loading';
import { useAppState } from '@/state/app';
import { priceQuote, productById } from '@/state/buy-service';
import { colors } from '@/theme';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Pricing() {
  const router = useRouter();
  const productId = useAppState((state) => state.quote.productId);
  const product = productById(productId);

  // Strict mode and fast refresh both re-run effects; the quote must be
  // priced once, not twice.
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    void priceQuote().then((result) => {
      // replace, not push: the spinner must not come back on a swipe back.
      if (result) router.replace('/buy/quote-result');
      else router.back();
    });
  }, [router]);

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      <View style={styles.flex}>
        <Loading
          title="Pricing your cover"
          body={`Asking ${product?.underwriter ?? 'the underwriter'} for a live premium. This may take a moment on a slow connection.`}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.surface },
});
