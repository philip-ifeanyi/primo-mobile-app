/**
 * The payment step, hosted in a WebView.
 *
 * WHY A WEBVIEW
 * -------------
 * Primo's payment flow is a Lit web-component library served from
 * https://payment-sdk.pages.dev/bundle.js. It is not a thin gateway wrapper:
 * the bundle registers `payment-options`, `debit-card`, `create-mandate`,
 * `mandate-summary`, `receipt-page` and a handler per gateway
 * (`paystack-handler`, `monnify-handler`, `interswitch-handler`), loads
 * Paystack's and Monnify's own inline JS itself, and talks to the backend
 * directly with the access token it is handed. In other words it owns
 * Initialize, the gateway hand-off, Confirm, the direct-debit mandate and the
 * receipt — the entire payment UI and state machine.
 *
 * So there is no native equivalent to reach for. Reimplementing it in React
 * Native would mean rebuilding three gateway integrations plus the mandate
 * and receipt flows, and then keeping them in step with the web version
 * forever. Rendering the same component the portal renders is the only way
 * these two clients stay consistent, which is why this is a WebView and not
 * a set of fetch calls.
 *
 * KNOWN BLOCKER
 * -------------
 * The bundle hardcodes https://104.131.48.195:44301 as its API host. That
 * host's certificate is self-signed, issued for CN=localhost and expired on
 * 16 June 2026, so requests from inside this WebView will fail TLS exactly as
 * they do everywhere else. The dev proxy does not help here: the URL is baked
 * into the SDK bundle, not configurable through an attribute. This screen is
 * therefore correct but not yet functional, and it unblocks the moment the
 * backend gets a valid certificate.
 */
import { colors } from '@/theme';
import { useCallback, useMemo, useRef } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

/** The SDK's full event taxonomy, read from the bundle. */
export type PaymentSdkEvent =
  | 'payment:initiated'
  | 'payment:processing'
  | 'payment:completed'
  | 'payment:failed'
  | 'payment:cancelled'
  | 'mandate:requested'
  | 'mandate:generated'
  | 'mandate:approved'
  | 'mandate:rejected'
  | 'mandate:completed'
  | 'receipt:generated'
  | 'receipt:sent'
  | 'receipt:downloaded'
  | 'error:network'
  | 'error:processing'
  | 'error:validation'
  | 'user:action'
  | 'user:navigation';

const SDK_EVENTS: PaymentSdkEvent[] = [
  'payment:initiated',
  'payment:processing',
  'payment:completed',
  'payment:failed',
  'payment:cancelled',
  'mandate:requested',
  'mandate:generated',
  'mandate:approved',
  'mandate:rejected',
  'mandate:completed',
  'receipt:generated',
  'receipt:sent',
  'receipt:downloaded',
  'error:network',
  'error:processing',
  'error:validation',
  'user:action',
  'user:navigation',
];

export type PaymentSdkProps = {
  accessToken: string;
  /** Minor-unit-free amount, as the portal passes it: a plain decimal string. */
  amount: string;
  quoteId: string;
  email: string;
  name: string;
  currency?: string;
  /** ABP PaymenTypes name. The portal sends "Product" when buying a policy. */
  paymentType?: 'Product' | 'Payment';
  onEvent: (event: PaymentSdkEvent, detail: unknown) => void;
  /** The WebView itself failed to load, as distinct from a payment failing. */
  onLoadFailure: (message: string) => void;
};

/**
 * JSON inside a <script> needs its closing-tag sequence broken up, or the
 * HTML parser ends the script early. The angle bracket is the only character
 * that matters, and < is still valid JSON for it.
 */
function embed(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function PaymentSdk({
  accessToken,
  amount,
  quoteId,
  email,
  name,
  currency = 'NGN',
  paymentType = 'Product',
  onEvent,
  onLoadFailure,
}: PaymentSdkProps) {
  const webRef = useRef<WebView>(null);

  const html = useMemo(() => {
    const config = {
      accessToken,
      amount,
      quoteId,
      email,
      name,
      currency,
      paymentType,
    };

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>
  html, body { margin: 0; padding: 0; background: ${colors.surface}; }
  body { -webkit-text-size-adjust: 100%; font-family: -apple-system, system-ui, sans-serif; }
</style>
<!-- The gateways' own SDKs. The bundle expects these globals to exist. -->
<script src="https://js.paystack.co/v1/inline.js"></script>
<script src="https://sdk.monnify.com/plugin/monnify.js"></script>
</head>
<body>
<payment-sdk></payment-sdk>
<script type="module" src="https://payment-sdk.pages.dev/bundle.js"></script>
<script>
(function () {
  var CONFIG = ${embed(config)};
  var EVENTS = ${embed(SDK_EVENTS)};

  function send(type, payload) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload }));
    } catch (e) {}
  }

  // Anything thrown inside the SDK would otherwise be invisible from RN.
  window.addEventListener('error', function (e) {
    send('__bridge:error', { message: String(e.message || 'script error') });
  });
  window.addEventListener('unhandledrejection', function (e) {
    send('__bridge:error', { message: String((e.reason && e.reason.message) || e.reason || 'promise rejection') });
  });

  customElements.whenDefined('payment-sdk').then(function () {
    var el = document.querySelector('payment-sdk');
    if (!el) { send('__bridge:error', { message: 'payment-sdk element missing' }); return; }

    // Set properties rather than attributes. Lit lowercases attribute names,
    // so markup would have to say "accesstoken"; assigning the property is
    // both case-correct and avoids putting a bearer token in the DOM as an
    // attribute string.
    el.accessToken = CONFIG.accessToken;
    el.amount = CONFIG.amount;
    el.currency = CONFIG.currency;
    el.paymentType = CONFIG.paymentType;
    el.quoteId = CONFIG.quoteId;
    el.email = CONFIG.email;
    el.name = CONFIG.name;

    // onEvent is the SDK's own subscription API, not addEventListener.
    if (typeof el.onEvent === 'function') {
      EVENTS.forEach(function (name) {
        el.onEvent(name, function (event) {
          send(name, (event && event.detail) || event || null);
        });
      });
      send('__bridge:ready', null);
    } else {
      send('__bridge:error', { message: 'payment-sdk exposes no onEvent()' });
    }
  }).catch(function (e) {
    send('__bridge:error', { message: String((e && e.message) || e) });
  });
})();
</script>
</body>
</html>`;
  }, [accessToken, amount, quoteId, email, name, currency, paymentType]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let parsed: { type?: string; payload?: unknown };
      try {
        parsed = JSON.parse(event.nativeEvent.data);
      } catch {
        return; // not ours
      }

      if (parsed.type === '__bridge:ready') return;
      if (parsed.type === '__bridge:error') {
        const detail = parsed.payload as { message?: string } | null;
        onLoadFailure(detail?.message ?? 'The payment form failed to load.');
        return;
      }
      if (parsed.type && SDK_EVENTS.includes(parsed.type as PaymentSdkEvent)) {
        onEvent(parsed.type as PaymentSdkEvent, parsed.payload);
      }
    },
    [onEvent, onLoadFailure]
  );

  return (
    <View style={styles.fill}>
      <WebView
        ref={webRef}
        source={{ html, baseUrl: 'https://payment-sdk.pages.dev' }}
        originWhitelist={['https://*']}
        onMessage={handleMessage}
        // The SDK opens gateway iframes and popups.
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        javaScriptCanOpenWindowsAutomatically
        // Paystack and Monnify both need third-party storage on iOS.
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        onError={({ nativeEvent }) =>
          onLoadFailure(nativeEvent.description ?? 'The payment form failed to load.')
        }
        onHttpError={({ nativeEvent }) =>
          onLoadFailure(`The payment form returned ${nativeEvent.statusCode}.`)
        }
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
        style={styles.fill}
        // Keeps the keyboard from covering the card fields on Android.
        {...(Platform.OS === 'android' ? { androidLayerType: 'hardware' as const } : null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.surface },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
