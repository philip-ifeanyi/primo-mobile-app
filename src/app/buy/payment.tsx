import { FlowHeader } from '@/components/buy/FlowHeader';
import { Loading } from '@/components/buy/Loading';
import { useAppState } from '@/state/app';
import { payAndIssuePolicy } from '@/state/buy-service';
import { shortBankName } from '@/state/kyc-service';
import { colors } from '@/theme';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Payment() {
  const router = useRouter();
  const frequency = useAppState((state) => state.quote.frequency);
  const hasResult = useAppState((state) => state.quote.result !== null);
  const bankName = useAppState((state) => state.kyc.bank.bankName);

  const isMonthly = frequency === 'monthly';

  // Strict mode and fast refresh both re-run effects; nobody gets charged twice.
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current || !hasResult) return;
    hasStarted.current = true;

    void payAndIssuePolicy().then((outcome) => {
      if (!outcome) {
        router.back();
        return;
      }
      // replace, so a swipe back cannot land on the Pay button again.
      router.replace({
        pathname: '/buy/success',
        params: {
          policyNumber: outcome.policy.policyNumber,
          nextDebit: outcome.nextDebitLabel,
        },
      });
    });
  }, [router, hasResult]);

  if (!hasResult) return <Redirect href="/buy/motor" />;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      <FlowHeader
        title="Secure payment"
        subtitle="paystack.com"
        backLabel="Cancel"
        onBack={() => router.back()}
      />

      <View style={styles.flex}>
        <Loading
          title={
            isMonthly ? 'Setting up your direct debit' : 'Taking your payment'
          }
          body={
            isMonthly
              ? `Don't close the app. We'll confirm your mandate with ${shortBankName(bankName)}.`
              : "Don't close the app while we confirm your payment."
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.surface },
});
