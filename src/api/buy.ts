/**
 * The product catalogue, motor quoting and payment.
 *
 * Every path, payload and enum here was read from the backend's own swagger
 * document (`/swagger/v1/swagger.json`, 359 paths), not inferred. Two shapes
 * worth noting up front, because they are inconsistent with each other:
 * `Category/GetAllCategories` returns a bare array, while `Product/GetAll`
 * returns ABP's paged `{ totalCount, items }` envelope.
 */
import { request } from './client';
import { IS_API_CONFIGURED } from './config';
import { ApiError } from './errors';

/* ------------------------------------------------------------------ enums */

/** ABP PaymentGateWays. */
export const GATEWAYS = { Interswitch: 0, Paystack: 1, Monnify: 2 } as const;

/**
 * ABP PaymentChannel. The backend distinguishes IOS from Android from the
 * generic Mobile, so send the real platform rather than Web — the gateway
 * configuration and the fees can differ per channel.
 */
export const CHANNELS = {
  Web: 0,
  SDK: 1,
  IOS: 2,
  Android: 3,
  Mobile: 4,
  Api: 5,
} as const;

/** ABP PaymenTypes (sic — one 't'). */
export const PAYMENT_TYPES = { Payment: 0, Product: 1 } as const;

/* --------------------------------------------------------------- catalogue */

export type Category = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  imageUrl: string | null;
  parentId: number | null;
};

export type Product = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  subCodes: string[];
};

/** GET services/app/Category/GetAllCategories — a bare array, not paged. */
export async function fetchCategories(): Promise<Category[]> {
  if (!IS_API_CONFIGURED) return [];
  const result = await request<Category[]>(
    '/services/app/Category/GetAllCategories'
  );
  return result ?? [];
}

/** GET services/app/Product/GetAll — paged, unlike the categories above. */
export async function fetchProducts(categoryId?: number): Promise<Product[]> {
  if (!IS_API_CONFIGURED) return [];
  const query = new URLSearchParams({ MaxResultCount: '100' });
  if (categoryId != null) query.set('CategoryId', String(categoryId));

  const result = await request<{ totalCount: number; items: Product[] }>(
    `/services/app/Product/GetAll?${query.toString()}`
  );
  return result?.items ?? [];
}

/* ----------------------------------------------------------------- vehicle */

export type VehicleMake = { id: string; makeName: string };
export type VehicleModel = { modelId: string; modelName: string };

/**
 * GET services/app/Insurance/GetVehicleMakes
 *
 * `id` is a string here, not a number, and it is what GetVehicleModel takes
 * as `VehicleMakeId` — so it must be carried around as a string rather than
 * parsed, or leading zeroes and non-numeric ids would be destroyed.
 */
export async function fetchVehicleMakes(): Promise<VehicleMake[]> {
  if (!IS_API_CONFIGURED) return [];
  const result = await request<VehicleMake[]>(
    '/services/app/Insurance/GetVehicleMakes'
  );
  return result ?? [];
}

/** GET services/app/Insurance/GetVehicleModel?VehicleMakeId= */
export async function fetchVehicleModels(
  makeId: string
): Promise<VehicleModel[]> {
  if (!IS_API_CONFIGURED) return [];
  const result = await request<VehicleModel[]>(
    `/services/app/Insurance/GetVehicleModel?VehicleMakeId=${encodeURIComponent(makeId)}`
  );
  return result ?? [];
}

/* ------------------------------------------------------------------- quote */

export type VehicleInput = {
  registrationNo: string;
  makeId: string;
  modelId: string;
  chassisNo: string;
  engineNo: string;
  bodyType: string;
  colour: string;
  manuYear: number;
  value: number;
  isCommercial: boolean;
};

export type Quote = {
  id: number;
  quoteNo: string;
  totalPremium: number;
  policyNo: string | null;
  certificateUrl: string | null;
  name: string | null;
  description: string | null;
};

/**
 * POST services/app/Insurance/VehicleQuote
 *
 * Takes an array of vehicles even though the flow quotes one at a time, and
 * `signature` is a required string on the DTO. The quote's `id` is what
 * GeneratePolicyDocument later wants as `quoteId`.
 */
export async function requestVehicleQuote(input: {
  productId: number;
  userId: number;
  signature: string;
  vehicle: VehicleInput;
}): Promise<Quote> {
  if (!IS_API_CONFIGURED) {
    throw new ApiError('offline', 'No API configured.');
  }

  const result = await request<Quote>('/services/app/Insurance/VehicleQuote', {
    method: 'POST',
    body: {
      productId: input.productId,
      userId: input.userId,
      signature: input.signature,
      vehicles: [input.vehicle],
    },
  });

  if (!result?.id) {
    throw new ApiError('rejected', 'The insurer did not return a quote.');
  }
  return result;
}

/* ----------------------------------------------------------------- payment */

/**
 * IMPORTANT: the two calls below are NOT how a purchase is paid for.
 *
 * Primo's payment flow lives in the `<payment-sdk>` web component
 * (https://payment-sdk.pages.dev/bundle.js), which the portal renders and
 * which this app renders in a WebView — see components/buy/PaymentSdk.tsx.
 * That bundle calls Initialize and Confirm itself, against a hardcoded API
 * host, and also owns the gateway hand-off, the direct-debit mandate and the
 * receipt. Calling Initialize from here as well would start a second,
 * orphaned payment.
 *
 * They are kept because they are still the right way to *read* a payment
 * back: reconciling a reference after the WebView reports an outcome, or
 * recovering when the app is killed mid-flow. Treat them as the
 * reconciliation path, not the checkout path.
 */

export type PaymentInit = {
  amount: number;
  reference: string;
  /** The gateway's hosted checkout page, for a webview. */
  url: string | null;
  paystackPublicKey: string | null;
  monnifyContractCode: string | null;
  monnifyApiKey: string | null;
};

/**
 * POST services/app/Payment/Initialize
 *
 * Returns both a hosted `url` and the gateway's public key, so either a
 * webview on that URL or a native SDK flow is possible. The webview is the
 * safer default: it needs no extra native dependency, and the card details
 * never pass through this app.
 */
export async function initializePayment(input: {
  amount: number;
  gateway?: number;
  channel: number;
  type?: number;
}): Promise<PaymentInit> {
  if (!IS_API_CONFIGURED) {
    throw new ApiError('offline', 'No API configured.');
  }

  const result = await request<PaymentInit>(
    '/services/app/Payment/Initialize',
    {
      method: 'POST',
      body: {
        amount: input.amount,
        type: input.type ?? PAYMENT_TYPES.Product,
        gateWay: input.gateway ?? GATEWAYS.Paystack,
        channel: input.channel,
      },
    }
  );

  if (!result?.reference) {
    throw new ApiError('rejected', 'The payment could not be started.');
  }
  return result;
}

export type PaymentResult = {
  status: string;
  message: string | null;
  transactionReference: string | null;
  paymentReference: string | null;
  amount: number;
  gatewayResponse: string | null;
};

/**
 * POST services/app/Payment/Confirm
 *
 * `status` is a free-text string rather than an enum, so it is compared
 * case-insensitively and anything that is not clearly a success is treated as
 * a failure. Note `amount` is int64 on the way in but double on the way back.
 */
export async function confirmPayment(input: {
  reference: string;
  amount: number;
  gateway?: number;
  channel: number;
  instrumentId?: string;
  metaData?: string;
}): Promise<PaymentResult> {
  const result = await request<PaymentResult>('/services/app/Payment/Confirm', {
    method: 'POST',
    body: {
      reference: input.reference,
      instrumentId: input.instrumentId ?? '',
      gateWay: input.gateway ?? GATEWAYS.Paystack,
      channel: input.channel,
      metaData: input.metaData ?? '',
      amount: Math.round(input.amount),
    },
  });

  if (!result) {
    throw new ApiError('rejected', 'The payment could not be confirmed.');
  }
  return result;
}

/** Whether a Confirm response represents money actually taken. */
export function isPaymentSuccessful(result: PaymentResult): boolean {
  return ['success', 'successful', 'completed', 'paid'].includes(
    (result.status ?? '').trim().toLowerCase()
  );
}

/* ------------------------------------------------------------------ policy */

export type PolicyDocument = {
  certificateUrl: string | null;
  policyUrl: string | null;
  errorMsg: string | null;
  mailSent: boolean;
  success: boolean;
};

/**
 * POST services/app/Insurance/GeneratePolicyDocument
 *
 * The last step: turns a paid quote into the certificate the customer keeps.
 * It reports its own `success` separately from the envelope, so that has to
 * be checked too.
 */
export async function generatePolicyDocument(
  quoteId: number
): Promise<PolicyDocument> {
  const result = await request<PolicyDocument>(
    '/services/app/Insurance/GeneratePolicyDocument',
    { method: 'POST', body: { quoteId } }
  );

  if (!result?.success) {
    throw new ApiError(
      'rejected',
      result?.errorMsg ?? 'The policy document could not be generated.'
    );
  }
  return result;
}
