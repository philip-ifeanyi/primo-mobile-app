import {
  confirmPayment,
  fetchCategories,
  fetchProducts,
  fetchVehicleMakes,
  fetchVehicleModels,
  generatePolicyDocument,
  isPaymentSuccessful,
  requestVehicleQuote,
  type Product as ApiProduct,
} from '@/api/buy';
import { CHANNELS } from '@/api/buy';
import { IS_API_CONFIGURED } from '@/api/config';
import { peekUserId } from '@/api/tokens';
import { Platform } from 'react-native';
import { useSyncExternalStore } from 'react';

import {
  addPolicy,
  formatNaira,
  readQuote,
  setQuote,
  type CoverLine,
  type Policy,
  type QuoteResult,
} from './app';
import {
  formatDayAndMonth,
  formatShortDate,
  toIsoDate,
  today,
} from './dates';

/**
 * The catalogue and everything the buy flow sends outward.
 *
 * Two sources, deliberately. When EXPO_PUBLIC_API_URL is set this calls the
 * real endpoints in api/buy.ts; when it is not, it falls back to the fixtures
 * below so the flow is still walkable offline. That fallback is not dead
 * code at the moment — the backend's certificate is expired, so it is the
 * path that actually runs. See api/config.ts.
 *
 * The screens read the catalogue synchronously (`productsFor`, `modelsFor`),
 * which the API cannot satisfy on its own. So the loaders below fill a cache
 * and notify subscribers, and `useCatalogue()` re-renders the screens when
 * real data lands. Same useSyncExternalStore arrangement as state/app.ts.
 */

const PRICING_DELAY_MS = 2200;
const PAYMENT_DELAY_MS = 2600;
const QUOTE_VALID_DAYS = 30;

export type Product = {
  id: string;
  /**
   * The backend's own id, which VehicleQuote takes as `productId`. Null for a
   * fixture product, which is how `priceQuote` knows it cannot really quote.
   */
  apiId: number | null;
  categoryId: string;
  name: string;
  underwriter: string;
  /** Underwriter's own code for the product, shown on the checkout summary. */
  code: string;
  description: string;
  premiumMonthly: number;
  popular?: boolean;
  /** Built per quote, because own-damage cover is the vehicle's value. */
  coverLines: (vehicleValue: number) => CoverLine[];
};

/**
 * Offline fallback for Product/GetAll. Kept because the real catalogue gives
 * a name, code, description and price but no underwriter and no cover
 * breakdown, both of which the design shows — so these also document the
 * shape the catalogue still owes us.
 */
export const PRODUCTS: Product[] = [
  {
    id: 'mot-cmp-02',
    apiId: null,
    categoryId: 'motor',
    name: 'Comprehensive Motor',
    underwriter: 'Leadway Assurance',
    code: 'MOT-CMP-02',
    description:
      'Accident, fire, theft and third-party liability up to ₦3m.',
    premiumMonthly: 9750,
    popular: true,
    coverLines: (value) => [
      { label: 'Own damage', value: formatNaira(value) },
      { label: 'Third-party property', value: formatNaira(3_000_000) },
      { label: 'Fire & theft', value: 'Included' },
      { label: 'Excess', value: formatNaira(50_000) },
    ],
  },
  {
    id: 'mot-tpp-01',
    apiId: null,
    categoryId: 'motor',
    name: 'Third-Party Plus',
    underwriter: 'AXA Mansard',
    code: 'MOT-TPP-01',
    description: 'Statutory third-party cover with ₦1m property damage limit.',
    premiumMonthly: 1540,
    coverLines: () => [
      { label: 'Own damage', value: 'Not covered' },
      { label: 'Third-party property', value: formatNaira(1_000_000) },
      { label: 'Fire & theft', value: 'Not covered' },
      { label: 'Excess', value: formatNaira(25_000) },
    ],
  },
  {
    id: 'mot-rid-03',
    apiId: null,
    categoryId: 'motor',
    name: 'Ride-hailing Cover',
    underwriter: 'Custodian Insurance',
    code: 'MOT-RID-03',
    description:
      'Commercial use for Bolt and Uber drivers, passenger liability included.',
    premiumMonthly: 14300,
    coverLines: (value) => [
      { label: 'Own damage', value: formatNaira(value) },
      { label: 'Third-party property', value: formatNaira(3_000_000) },
      { label: 'Passenger liability', value: 'Included' },
      { label: 'Excess', value: formatNaira(75_000) },
    ],
  },
];

/* ------------------------------------------------------------- fixtures */

/**
 * Offline fallback only. The real list comes from Insurance/GetVehicleMakes,
 * where a make has an opaque string id; here the name doubles as the id,
 * which is why MakeOption carries both rather than being a bare string.
 */
const FIXTURE_MAKES = [
  'Toyota',
  'Honda',
  'Lexus',
  'Mercedes-Benz',
  'Kia',
  'Hyundai',
  'Nissan',
  'Ford',
  'Mitsubishi',
  'Peugeot',
];

/** Offline fallback for Insurance/GetVehicleModel, keyed by the name above. */
const FIXTURE_MODELS: Record<string, string[]> = {
  Toyota: ['Corolla', 'Camry', 'RAV4', 'Hilux', 'Highlander', 'Avensis'],
  Honda: ['Accord', 'Civic', 'CR-V', 'Pilot'],
  Lexus: ['ES 350', 'RX 350', 'GX 460', 'IS 250'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'GLK', 'ML'],
  Kia: ['Rio', 'Sportage', 'Picanto', 'Sorento'],
  Hyundai: ['Elantra', 'Tucson', 'Santa Fe', 'Accent'],
  Nissan: ['Altima', 'Rogue', 'Pathfinder', 'Sentra'],
  Ford: ['Focus', 'Escape', 'Explorer', 'Edge'],
  Mitsubishi: ['Lancer', 'Outlander', 'Pajero'],
  Peugeot: ['301', '508', '3008'],
};

/* ----------------------------------------------------- catalogue cache */

export type MakeOption = { id: string; name: string };
export type ModelOption = { id: string; name: string };

type Catalogue = {
  /** Keyed by the category id the screens route on. */
  products: Record<string, Product[]>;
  makes: MakeOption[];
  /** Keyed by make id, because that is what the models endpoint takes. */
  models: Record<string, ModelOption[]>;
};

let catalogue: Catalogue = { products: {}, makes: [], models: {} };

const listeners = new Set<() => void>();

function emitCatalogue() {
  catalogue = { ...catalogue };
  listeners.forEach((listener) => listener());
}

function subscribeCatalogue(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Re-renders a screen when the catalogue arrives. The selector keeps a screen
 * that only wants makes from re-rendering when products change.
 */
export function useCatalogue<T>(select: (catalogue: Catalogue) => T): T {
  return useSyncExternalStore(
    subscribeCatalogue,
    () => select(catalogue),
    () => select(catalogue)
  );
}

/**
 * The API gives a product a name, code, description and price, but no
 * underwriter and no cover breakdown — both of which the design shows. The
 * underwriter is left blank rather than invented, and the cover lines are
 * derived from the vehicle's value, which is the one figure that is genuinely
 * known. Whoever owns the catalogue needs to supply the rest.
 */
function toProduct(product: ApiProduct, categoryId: string): Product {
  return {
    id: String(product.id),
    apiId: product.id,
    categoryId,
    name: product.name,
    underwriter: '',
    code: product.code,
    description: product.description ?? '',
    premiumMonthly: product.price,
    coverLines: (vehicleValue: number) => [
      { label: 'Own damage', value: formatNaira(vehicleValue) },
    ],
  };
}

/**
 * Resolves the route's slug ("motor") to the backend's numeric category id.
 *
 * The two vocabularies are unrelated: the app routes on a slug, and
 * Product/GetAll filters on an int. Category/GetAllCategories carries a
 * `name` and a `code`, so the slug is matched against both, case- and
 * punctuation-insensitively — "health" should find "Health & Life", and
 * "motor" should find either "Motor" or a code like "MOT".
 */
async function resolveCategoryId(slug: string): Promise<number | undefined> {
  if (categoryIds === null) {
    try {
      const categories = await fetchCategories();
      categoryIds = {};
      for (const category of categories) {
        for (const key of [category.name, category.code]) {
          if (key) categoryIds[normalise(key)] = category.id;
        }
      }
    } catch {
      categoryIds = {};
    }
  }

  const wanted = normalise(slug);
  const exact = categoryIds[wanted];
  if (exact !== undefined) return exact;

  // "health" against "healthlife": a prefix match is the common case.
  const key = Object.keys(categoryIds).find(
    (candidate) => candidate.startsWith(wanted) || wanted.startsWith(candidate)
  );
  return key ? categoryIds[key] : undefined;
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Resolved once per launch; the category list does not change mid-session. */
let categoryIds: Record<string, number> | null = null;

/** GET Product/GetAll?CategoryId= — falls back to the fixtures. */
export async function loadProducts(categoryId: string): Promise<void> {
  if (!IS_API_CONFIGURED) {
    catalogue.products[categoryId] = PRODUCTS.filter(
      (product) => product.categoryId === categoryId
    );
    emitCatalogue();
    return;
  }

  try {
    const resolved = await resolveCategoryId(categoryId);
    const products = await fetchProducts(resolved);
    catalogue.products[categoryId] = products.map((product) =>
      toProduct(product, categoryId)
    );
  } catch {
    // A catalogue that will not load should not be an empty shop; the
    // fixtures at least let the flow be walked and inspected.
    catalogue.products[categoryId] = PRODUCTS.filter(
      (product) => product.categoryId === categoryId
    );
  }
  emitCatalogue();
}

/** GET Insurance/GetVehicleMakes */
export async function loadVehicleMakes(): Promise<void> {
  if (!IS_API_CONFIGURED) {
    catalogue.makes = FIXTURE_MAKES.map((name) => ({ id: name, name }));
    emitCatalogue();
    return;
  }

  try {
    const makes = await fetchVehicleMakes();
    catalogue.makes = makes.map((make) => ({
      id: make.id,
      name: make.makeName,
    }));
  } catch {
    catalogue.makes = FIXTURE_MAKES.map((name) => ({ id: name, name }));
  }
  emitCatalogue();
}

/** GET Insurance/GetVehicleModel?VehicleMakeId= */
export async function loadVehicleModels(makeId: string): Promise<void> {
  if (catalogue.models[makeId]) return; // already fetched

  if (!IS_API_CONFIGURED) {
    catalogue.models[makeId] = (FIXTURE_MODELS[makeId] ?? []).map((name) => ({
      id: name,
      name,
    }));
    emitCatalogue();
    return;
  }

  try {
    const models = await fetchVehicleModels(makeId);
    catalogue.models[makeId] = models.map((model) => ({
      id: model.modelId,
      name: model.modelName,
    }));
  } catch {
    catalogue.models[makeId] = [];
  }
  emitCatalogue();
}

export function productsFor(categoryId: string): Product[] {
  return (
    catalogue.products[categoryId] ??
    PRODUCTS.filter((product) => product.categoryId === categoryId)
  );
}

export function productById(id: string | null): Product | null {
  if (!id) return null;
  for (const list of Object.values(catalogue.products)) {
    const found = list.find((product) => product.id === id);
    if (found) return found;
  }
  return PRODUCTS.find((product) => product.id === id) ?? null;
}

export function vehicleMakes(): MakeOption[] {
  return catalogue.makes;
}

export function modelsFor(makeId: string | null): ModelOption[] {
  if (!makeId) return [];
  return catalogue.models[makeId] ?? [];
}

export const BODY_TYPES = ['Saloon', 'SUV', 'Bus', 'Pick-up'] as const;

function addDays(from: Date, days: number) {
  return new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
}

/** Five digits, so quote and policy references look like the real thing. */
function reference() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

/**
 * Prices the quote currently in state.
 *
 * POST Insurance/VehicleQuote. The endpoint takes an array of vehicles even
 * though the flow quotes one at a time, and it wants the insurer's own make
 * and model ids rather than the names the UI shows — hence makeId/modelId on
 * the vehicle. `signature` is required by the DTO; it is the customer's
 * declaration, and until the flow captures one the registration number
 * stands in so the field is at least traceable to the vehicle.
 *
 * The response carries `totalPremium` for the term, not a monthly figure, so
 * the monthly number shown in the UI is derived rather than quoted.
 */
export async function priceQuote(): Promise<QuoteResult | null> {
  const quote = readQuote();
  const product = productById(quote.productId);
  if (!product || quote.value === null) return null;

  // No API, or a fixture product with no backend id: price from the fixture.
  if (!IS_API_CONFIGURED || product.apiId === null) {
    await new Promise((resolve) => setTimeout(resolve, PRICING_DELAY_MS));

    const result: QuoteResult = {
      quoteId: `QT-${reference()}`,
      id: 0,
      premiumMonthly: product.premiumMonthly,
      premiumYearly: product.premiumMonthly * 12,
      validUntil: toIsoDate(addDays(today(), QUOTE_VALID_DAYS)),
      cover: product.coverLines(quote.value),
    };
    setQuote({ result });
    return result;
  }

  const { vehicle } = quote;
  if (!vehicle.makeId || !vehicle.modelId) return null;

  const quoted = await requestVehicleQuote({
    productId: product.apiId,
    userId: peekUserId() ?? 0,
    signature: vehicle.registrationNo,
    vehicle: {
      registrationNo: vehicle.registrationNo,
      makeId: vehicle.makeId,
      modelId: vehicle.modelId,
      chassisNo: vehicle.chassisNo,
      engineNo: vehicle.engineNo,
      bodyType: quote.bodyType ?? '',
      colour: vehicle.colour,
      manuYear: Number(vehicle.year) || 0,
      value: quote.value,
      isCommercial: vehicle.isCommercial,
    },
  });

  const yearly = quoted.totalPremium;
  const result: QuoteResult = {
    quoteId: quoted.quoteNo,
    id: quoted.id,
    // Derived, not quoted: the API returns one figure for the whole term.
    premiumMonthly: Math.round(yearly / 12),
    premiumYearly: yearly,
    validUntil: toIsoDate(addDays(today(), QUOTE_VALID_DAYS)),
    cover: product.coverLines(quote.value),
  };

  setQuote({ result });
  return result;
}

/** What the user is charged now, given the frequency they picked. */
export function amountDue(result: QuoteResult, frequency: 'monthly' | 'one_off') {
  return frequency === 'monthly' ? result.premiumMonthly : result.premiumYearly;
}

export type PaymentOutcome = {
  policy: Policy;
  /** Human-readable next debit, e.g. "12 October". Empty for a one-off. */
  nextDebitLabel: string;
};

/**
 * Turns a paid quote into a policy.
 *
 * Call this *after* the payment SDK reports success — it does not take money.
 * Payment belongs to the `<payment-sdk>` web component rendered in
 * components/buy/PaymentSdk.tsx, which owns Initialize, the gateway, Confirm
 * and the mandate. This is only the step after: POST
 * Insurance/GeneratePolicyDocument, which issues the certificate.
 *
 * `reference` is optional and only used to reconcile: when the SDK hands one
 * back, Payment/Confirm is re-read to make sure money really moved before a
 * policy is recorded. Without it the SDK's own success event is taken at its
 * word, which is the case offline.
 */
export async function issuePolicyForPaidQuote(
  reference?: string
): Promise<PaymentOutcome | null> {
  const quote = readQuote();
  const product = productById(quote.productId);
  if (!product || !quote.result || quote.value === null) return null;

  if (!IS_API_CONFIGURED || quote.result.id === 0) {
    await new Promise((resolve) => setTimeout(resolve, PAYMENT_DELAY_MS));
    return recordPolicy(product, quote.result, quote.value, quote.frequency);
  }

  // Trust the server over the client about whether money moved.
  if (reference) {
    const confirmation = await confirmPayment({
      reference,
      amount: amountDue(quote.result, quote.frequency),
      channel: paymentChannel(),
    });
    if (!isPaymentSuccessful(confirmation)) return null;
  }

  const document = await generatePolicyDocument(quote.result.id);

  const outcome = recordPolicy(
    product,
    quote.result,
    quote.value,
    quote.frequency,
    document.policyUrl ?? document.certificateUrl ?? null
  );
  return outcome;
}

/** The platform the backend should attribute the payment to. */
function paymentChannel(): number {
  return Platform.OS === 'ios' ? CHANNELS.IOS : CHANNELS.Android;
}

/**
 * Builds the local policy record. The server is the authority on the policy
 * number once GeneratePolicyDocument is live; until the quote carries one,
 * this mints a reference so the success screen has something to show.
 */
function recordPolicy(
  product: Product,
  result: QuoteResult,
  value: number,
  frequency: 'monthly' | 'one_off',
  documentUrl: string | null = null
): PaymentOutcome {
  const start = today();
  const nextDebit = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    start.getDate()
  );
  // A year of cover runs to the day before the anniversary.
  const expires = addDays(
    new Date(start.getFullYear() + 1, start.getMonth(), start.getDate()),
    -1
  );

  const policy: Policy = {
    id: result.quoteId,
    name: product.name,
    underwriter: product.underwriter,
    policyNumber:
      result.quoteId || `PRM/MOT/${start.getFullYear()}/${reference()}`,
    coverAmount: value,
    premiumMonthly: result.premiumMonthly,
    nextDebit: formatShortDate(toIsoDate(nextDebit)) ?? '',
    expires: formatShortDate(toIsoDate(expires)) ?? '',
    documentUrl,
  };

  addPolicy(policy);

  return {
    policy,
    nextDebitLabel: frequency === 'monthly' ? formatDayAndMonth(nextDebit) : '',
  };
}
