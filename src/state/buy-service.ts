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
 * The catalogue and everything the buy flow sends outward, stubbed.
 *
 * Same arrangement as kyc-service: no network yet, each function carries the
 * endpoint it stands in for, and the screens stay unaware of how the work gets
 * done. Wiring the real API should be a change to this file alone.
 */

const PRICING_DELAY_MS = 2200;
const PAYMENT_DELAY_MS = 2600;
const QUOTE_VALID_DAYS = 30;

export type Product = {
  id: string;
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

/** TODO: replace with GET /catalogue/products?category=. */
export const PRODUCTS: Product[] = [
  {
    id: 'mot-cmp-02',
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

export function productsFor(categoryId: string) {
  return PRODUCTS.filter((product) => product.categoryId === categoryId);
}

export function productById(id: string | null) {
  return PRODUCTS.find((product) => product.id === id) ?? null;
}

/** TODO: replace with GET /catalogue/vehicle-makes. */
export const VEHICLE_MAKES = [
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
] as const;

/**
 * TODO: replace with GET /catalogue/vehicle-models?make=. The helper text on
 * the field ("Models load after you pick a make") already promises this is a
 * second request, so the picker stays disabled until a make is chosen.
 */
const MODELS_BY_MAKE: Record<string, string[]> = {
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

export function modelsFor(make: string | null) {
  if (!make) return [];
  return MODELS_BY_MAKE[make] ?? [];
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
 * TODO: replace with POST /quotes { productId, vehicle, value, bodyType }.
 * The premium here is just the product's advertised monthly price; a real
 * underwriter rates on the vehicle's value, age and body type, so this will
 * stop being a pure function of the product once the endpoint is live.
 */
export async function priceQuote(): Promise<QuoteResult | null> {
  const quote = readQuote();
  const product = productById(quote.productId);
  if (!product || quote.value === null) return null;

  await new Promise((resolve) => setTimeout(resolve, PRICING_DELAY_MS));

  const result: QuoteResult = {
    quoteId: `QT-${reference()}`,
    premiumMonthly: product.premiumMonthly,
    premiumYearly: product.premiumMonthly * 12,
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
 * Takes payment and issues the policy.
 *
 * TODO: replace with POST /orders followed by the Paystack flow — a webview or
 * the SDK — and then POST /orders/:id/confirm on the success callback. The
 * policy must come back from the server; minting one on the device, as here,
 * is only safe because nothing is actually charged.
 */
export async function payAndIssuePolicy(): Promise<PaymentOutcome | null> {
  const quote = readQuote();
  const product = productById(quote.productId);
  if (!product || !quote.result || quote.value === null) return null;

  await new Promise((resolve) => setTimeout(resolve, PAYMENT_DELAY_MS));

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
    id: quote.result.quoteId,
    name: product.name,
    underwriter: product.underwriter,
    policyNumber: `PRM/MOT/${start.getFullYear()}/${reference()}`,
    coverAmount: quote.value,
    premiumMonthly: product.premiumMonthly,
    nextDebit: formatShortDate(toIsoDate(nextDebit)) ?? '',
    expires: formatShortDate(toIsoDate(expires)) ?? '',
  };

  addPolicy(policy);

  return {
    policy,
    nextDebitLabel:
      quote.frequency === 'monthly'
        ? formatDayAndMonth(nextDebit)
        : '',
  };
}
