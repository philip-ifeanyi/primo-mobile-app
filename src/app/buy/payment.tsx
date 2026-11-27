import { peekTokens } from '@/api/tokens';
import { FlowHeader } from '@/components/buy/FlowHeader';
import { Loading } from '@/components/buy/Loading';
import {
  PaymentSdk,
  type PaymentSdkEvent,
} from '@/components/buy/PaymentSdk';
import { useAppState } from '@/state/app';
import { amountDue, issuePolicyForPaidQuote } from '@/state/buy-service';
import { shortBankName } from '@/state/kyc-service';
import { colors } from '@/theme';
import { Redirect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * The payment step.
 *
 * The card form, gateway choice, direct-debit mandate and receipt all belong
 * to Primo's `<payment-sdk>` web component, which this renders in a WebView
 * (see components/buy/PaymentSdk.tsx for why). This screen's job is only to
 * hand the SDK its inputs, watch its events, and issue the policy once it
 * reports that money moved.
 */
export default function Payment() {
  const router = useRouter();
  const quote = useAppState((state) => state.quote);
  const user = useAppState((state) => state.user);
  const bankName = useAppState((state) => state.kyc.bank.bankName);

  const [issuing, setIssuing] = useState(false);
  const isMonthly = quote.frequency === 'monthly';

  // The SDK can emit payment:completed and then receipt:sent; only the first
  // one should issue a policy.
  const settled = useRef(false);

  const finish = useCallback(
    async (reference?: string) => {
      if (settled.current) return;
      settled.current = true;
      setIssuing(true);

      try {
        const outcome = await issuePolicyForPaidQuote(reference);
        if (!outcome) {
          // Payment did not actually confirm. Let the user try again rather
          // than stranding them on a spinner.
          settled.current = false;
          setIssuing(false);
          Alert.alert(
            'Payment not confirmed',
            'We could not confirm that payment. Nothing has been charged twice — please try again.'
          );
          return;
        }

        router.replace({
          pathname: '/buy/success',
          params: {
            policyNumber: outcome.policy.policyNumber,
            nextDebit: outcome.nextDebitLabel,
          },
        });
      } catch {
        settled.current = false;
        setIssuing(false);
        Alert.alert(
          'Something went wrong',
          'Your payment may have gone through. Please check Policies before paying again.'
        );
      }
    },
    [router]
  );

  const onEvent = useCallback(
    (event: PaymentSdkEvent, detail: unknown) => {
      const reference =
        typeof detail === 'object' && detail !== null
          ? ((detail as { reference?: string }).reference ?? undefined)
          : undefined;

      switch (event) {
        // Either of these means the flow reached a paid state. A monthly plan
        // completes as a mandate rather than a one-off payment.
        case 'payment:completed':
        case 'mandate:completed':
          void finish(reference);
          break;

        case 'payment:failed':
        case 'mandate:rejected':
          Alert.alert('Payment failed', 'No money has left your account.');
          break;

        case 'payment:cancelled':
          router.back();
          break;

        case 'error:network':
          Alert.alert(
            'Connection problem',
            'The payment service could not be reached. Please try again.'
          );
          break;

        default:
          // The remaining events are progress and telemetry; the SDK renders
          // its own state for those.
          break;
      }
    },
    [finish, router]
  );

  const onLoadFailure = useCallback((message: string) => {
    Alert.alert('Payment unavailable', message);
  }, []);

  if (!quote.result) return <Redirect href="/buy/motor" />;

  const tokens = peekTokens();
  if (!tokens) return <Redirect href="/auth/login" />;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      <FlowHeader
        title="Secure payment"
        subtitle="Primo Payments"
        backLabel="Cancel"
        onBack={() => router.back()}
      />

      <View style={styles.flex}>
        {issuing ? (
          <Loading
            title={
              isMonthly ? 'Setting up your direct debit' : 'Issuing your policy'
            }
            body={
              isMonthly
                ? `Don't close the app. We'll confirm your mandate with ${shortBankName(bankName)}.`
                : "Don't close the app while we issue your certificate."
            }
          />
        ) : (
          <PaymentSdk
            accessToken={tokens.accessToken}
            amount={String(amountDue(quote.result, quote.frequency))}
            quoteId={String(quote.result.id)}
            email={user.email}
            name={`${user.firstName} ${user.lastName}`.trim()}
            paymentType="Product"
            onEvent={onEvent}
            onLoadFailure={onLoadFailure}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.surface },
});
