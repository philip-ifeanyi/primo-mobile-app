import type { DocumentTypeName } from '../api/kyc';

import { useSyncExternalStore } from 'react';

/** Titles for the 8 KYC steps, in order. Index 0 is step 1. */
export const KYC_STEPS = [
  'Your details',
  'Bank account',
  'BVN',
  'Employer',
  'Medical',
  'Documents',
  'Under review',
  'Approved',
] as const;

/** Step numbers are 1-based everywhere, matching the "n/8" label. */
export const FIRST_KYC_STEP = 1;
export const REVIEW_KYC_STEP = 7;
export const APPROVED_KYC_STEP = 8;

export type Policy = {
  id: string;
  name: string;
  underwriter: string;
  policyNumber: string;
  coverAmount: number;
  premiumMonthly: number;
  nextDebit: string;
  expires: string;
  /**
   * The certificate PDF, as returned by Insurance/GeneratePolicyDocument.
   * Null for a policy issued offline against the fixtures, so anything that
   * offers to open or share it must handle its absence.
   */
  documentUrl: string | null;
};

export type Referral = {
  id: string;
  name: string;
  meta: string;
  /** Paid out in naira, or null while the friend has not bought a policy yet. */
  amount: number | null;
};

/** Shared shape for the two calls that go out to a third party and come back. */
export type VerifyStatus = 'idle' | 'pending' | 'done' | 'error';

export type KycDetails = {
  firstName: string;
  surname: string;
  /** ISO yyyy-mm-dd, or null until the user picks one. */
  dateOfBirth: string | null;
  username: string;
};

export type KycBank = {
  bankCode: string | null;
  bankName: string | null;
  /** NUBAN: exactly 10 digits. */
  nuban: string;
  status: VerifyStatus;
  /** Name the bank returned, e.g. "ADAEZE C. OKONKWO". */
  accountName: string | null;
  error: string | null;
};

export type KycBvn = {
  /** Exactly 11 digits. */
  number: string;
  status: VerifyStatus;
  matchedName: string | null;
  error: string | null;
};

export type KycEmployer = {
  name: string;
  phone: string;
  tin: string;
  address: string;
};

export type MedicalAnswer = {
  condition: string;
  /** null until the user taps Yes or No. */
  hasCondition: boolean | null;
  details: string;
};

export type KycDocument = {
  /** Local file URI from the camera or gallery. */
  uri: string | null;
  fileName: string | null;
  /** 0-100. */
  progress: number;
  status: 'none' | 'uploading' | 'uploaded' | 'error';
  issuedOn: string | null;
  expiresOn: string | null;
  /**
   * Which kind of ID this is. The backend requires it (DocumentTypes, 0-5)
   * and step 6 has no picker for it yet, so this default is a placeholder,
   * not a decision — the screen needs a selector before KYC is truthful.
   */
  docType: DocumentTypeName;
};

export type KycState = {
  /** 1-8. */
  currentStep: number;
  status: 'incomplete' | 'in_review' | 'approved';
  details: KycDetails;
  bank: KycBank;
  bvn: KycBvn;
  employer: KycEmployer;
  medical: MedicalAnswer[];
  document: KycDocument;
  notificationsOptIn: boolean;
};

export type Vehicle = {
  /** Display name, for the UI. */
  make: string | null;
  model: string | null;
  /**
   * The insurer's own identifiers, which is what VehicleQuote actually takes.
   * Both are strings in the API — GetVehicleMakes returns `id` as a string —
   * so they must not be parsed to numbers or leading zeroes would be lost.
   */
  makeId: string | null;
  modelId: string | null;
  year: string;
  colour: string;
  /** Plate number. Required by VehicleQuote. */
  registrationNo: string;
  /** Required by VehicleQuote; found on the vehicle's licence. */
  chassisNo: string;
  engineNo: string;
  /** Ride-hailing and other commercial use rates differently. */
  isCommercial: boolean;
};

/**
 * A blank vehicle. Three places need one — the initial state and both quote
 * resets — and they had drifted apart before; a factory means a new field is
 * added once.
 */
export function emptyVehicle(): Vehicle {
  return {
    make: null,
    model: null,
    makeId: null,
    modelId: null,
    year: '',
    colour: '',
    registrationNo: '',
    chassisNo: '',
    engineNo: '',
    isCommercial: false,
  };
}

/** One row of the "What's covered" list on the quote result. */
export type CoverLine = { label: string; value: string };

export type QuoteResult = {
  /**
   * The insurer's quote reference, shown to the user (`quoteNo`).
   */
  quoteId: string;
  /**
   * The backend's numeric id for the quote. GeneratePolicyDocument takes this
   * as `quoteId`, and the payment SDK takes it too — so it is not the same
   * value as the reference above, despite the shared name upstream.
   */
  id: number;
  premiumYearly: number;
  premiumMonthly: number;
  /** ISO yyyy-mm-dd. */
  validUntil: string;
  cover: CoverLine[];
};

export type PaymentFrequency = 'monthly' | 'one_off';

export type QuoteState = {
  /** Product being quoted, or null before one is picked. */
  productId: string | null;
  vehicle: Vehicle;
  /** Naira, or null while the field is empty. */
  value: number | null;
  bodyType: string | null;
  beneficiary: string | null;
  /** Filled once pricing comes back. */
  result: QuoteResult | null;
  frequency: PaymentFrequency;
};

type AppState = {
  user: { firstName: string; lastName: string; email: string };
  kyc: KycState;
  quote: QuoteState;
  policies: Policy[];
  referrals: {
    code: string;
    stats: { total: number; pending: number; paid: string };
    list: Referral[];
  };
};

/** The four conditions on step 5, in the order the design lists them. */
const MEDICAL_CONDITIONS = [
  'Hypertension',
  'Diabetes',
  'Asthma',
  'Sickle cell disorder',
] as const;

// Sample data from the design handoff until the API is wired in.
// Steps 1 and 2 are filled to match currentStep 3, so the wizard opens the way
// a part-finished application would. Delete the seeded values with the stubs.
let state: AppState = {
  user: {
    firstName: 'Adaeze',
    lastName: 'Okonkwo',
    email: 'adaeze.okonkwo@gmail.com',
  },
  kyc: {
    currentStep: 3,
    status: 'incomplete',
    details: {
      firstName: 'Adaeze',
      surname: 'Okonkwo',
      dateOfBirth: '1994-03-14',
      username: 'adaeze',
    },
    bank: {
      bankCode: '058',
      bankName: 'Guaranty Trust Bank',
      nuban: '0123456789',
      status: 'done',
      accountName: 'ADAEZE C. OKONKWO',
      error: null,
    },
    bvn: { number: '', status: 'idle', matchedName: null, error: null },
    employer: { name: '', phone: '', tin: '', address: '' },
    medical: MEDICAL_CONDITIONS.map((condition) => ({
      condition,
      hasCondition: null,
      details: '',
    })),
    document: {
      uri: null,
      fileName: null,
      progress: 0,
      status: 'none',
      issuedOn: null,
      expiresOn: null,
      docType: 'NationalId',
    },
    notificationsOptIn: true,
  },
  quote: {
    productId: null,
    vehicle: emptyVehicle(),
    value: null,
    bodyType: null,
    beneficiary: null,
    result: null,
    frequency: 'monthly',
  },
  policies: [],
  referrals: {
    code: 'ADA-7K2M',
    stats: { total: 7, pending: 2, paid: '₦10k' },
    list: [
      { id: '1', name: 'Chidi Eze', meta: 'Joined 2 Sep', amount: 2000 },
      { id: '2', name: 'Funmi Bello', meta: 'Awaiting first policy', amount: null },
    ],
  },
};

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function setAppState(patch: Partial<AppState>) {
  state = { ...state, ...patch };
  emit();
}

/**
 * The selector must return a slice of the state object itself (not a freshly
 * built object), otherwise useSyncExternalStore sees a new value every render.
 */
export function useAppState<T>(selector: (state: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}

/**
 * Read the KYC slice outside React — for the service callbacks, which resolve
 * after the screen that started them may already be unmounted.
 */
export function readKyc(): KycState {
  return state.kyc;
}

export function setKyc(patch: Partial<KycState>) {
  state = { ...state, kyc: { ...state.kyc, ...patch } };
  emit();
}

/** Merges into one nested object of the KYC slice, leaving its siblings alone. */
function setKycPart<K extends 'details' | 'bank' | 'bvn' | 'employer' | 'document'>(
  key: K,
  patch: Partial<KycState[K]>
) {
  setKyc({ [key]: { ...state.kyc[key], ...patch } } as Partial<KycState>);
}

export const setKycDetails = (patch: Partial<KycDetails>) =>
  setKycPart('details', patch);
export const setKycBank = (patch: Partial<KycBank>) => setKycPart('bank', patch);
export const setKycBvn = (patch: Partial<KycBvn>) => setKycPart('bvn', patch);
export const setKycEmployer = (patch: Partial<KycEmployer>) =>
  setKycPart('employer', patch);
export const setKycDocument = (patch: Partial<KycDocument>) =>
  setKycPart('document', patch);

export function setMedicalAnswer(index: number, patch: Partial<MedicalAnswer>) {
  setKyc({
    medical: state.kyc.medical.map((answer, i) =>
      i === index ? { ...answer, ...patch } : answer
    ),
  });
}

/**
 * Records the furthest step the user has reached, so the home banner and the
 * KYC gate reopen the wizard where they left off. Never moves backwards:
 * tapping back to step 2 should not undo the progress bar on Home.
 */
export function advanceKycProgress(step: number) {
  if (step > state.kyc.currentStep) setKyc({ currentStep: step });
}

export function readQuote(): QuoteState {
  return state.quote;
}

export function setQuote(patch: Partial<QuoteState>) {
  state = { ...state, quote: { ...state.quote, ...patch } };
  emit();
}

export function setQuoteVehicle(patch: Partial<Vehicle>) {
  setQuote({ vehicle: { ...state.quote.vehicle, ...patch } });
}

/**
 * Clears everything from a previous quote.
 *
 * Starting a new one from the product list must not inherit the last car or,
 * worse, the last premium — a stale `result` would let checkout charge for
 * cover the user is no longer buying.
 */
export function startQuote(productId: string) {
  setQuote({
    productId,
    vehicle: emptyVehicle(),
    value: null,
    bodyType: null,
    beneficiary: null,
    result: null,
    frequency: 'monthly',
  });
}

/**
 * Drops the finished quote once its policy is issued.
 *
 * This is also what stops a second charge: checkout and the quote result both
 * redirect away when there is no `result`, so swiping back from the success
 * screen cannot land on a live Pay button.
 */
export function clearQuote() {
  setQuote({
    productId: null,
    vehicle: emptyVehicle(),
    value: null,
    bodyType: null,
    beneficiary: null,
    result: null,
    frequency: 'monthly',
  });
}

export function addPolicy(policy: Policy) {
  state = { ...state, policies: [policy, ...state.policies] };
  emit();
}

export function initialsOf(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** 4200000 -> "₦4,200,000". Regex rather than Intl so it never depends on the JS engine's locale data. */
export function formatNaira(amount: number) {
  return `₦${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}
