import {
  readKyc,
  setKyc,
  setKycBank,
  setKycBvn,
  setKycDocument,
  APPROVED_KYC_STEP,
  REVIEW_KYC_STEP,
} from './app';

/**
 * Every call the KYC wizard makes to the outside world lives here, stubbed.
 *
 * None of these touch the network yet — the backend contract has not landed.
 * Each one simulates the latency and the state transitions the screens need so
 * the wizard behaves correctly, and each carries the endpoint it is standing in
 * for. Wiring the real API should be a change to this file only; no screen
 * knows how the work gets done.
 */

const RESOLVE_DELAY_MS = 1400;
const VERIFY_DELAY_MS = 2200;
/** The design's upload: 8% a tick, 110ms apart, so ~1.4s end to end. */
const UPLOAD_TICK_MS = 110;
const UPLOAD_TICK_PERCENT = 8;

export type Bank = { code: string; name: string };

/**
 * TODO: replace with GET /banks. NIBSS codes, so the list is stable enough to
 * hardcode in the meantime; the real list is longer and changes.
 */
export const BANKS: Bank[] = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank Nigeria' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '50211', name: 'Kuda Microfinance Bank' },
  { code: '50515', name: 'Moniepoint Microfinance Bank' },
  { code: '999992', name: 'OPay' },
  { code: '999991', name: 'PalmPay' },
  { code: '076', name: 'Polaris Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
];

/** "Guaranty Trust Bank" -> "GTBank", for the "Checking with GTBank…" line. */
export function shortBankName(name: string | null) {
  if (!name) return 'your bank';
  if (name === 'Guaranty Trust Bank') return 'GTBank';
  return name.replace(/ (Nigeria|of Nigeria|Microfinance Bank|Bank)$/, '');
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Asks the bank for the name on an account.
 *
 * TODO: replace with POST /kyc/bank/resolve { bankCode, nuban }. Reads the
 * profile name back so the "Name matches your profile" result row is honest;
 * the real endpoint returns whatever the bank holds, which may well differ, and
 * a mismatch needs its own error state.
 */
export async function resolveAccountName() {
  const { bank, details } = readKyc();
  if (bank.nuban.length !== 10 || !bank.bankCode) return;

  setKycBank({ status: 'pending', accountName: null, error: null });
  await wait(RESOLVE_DELAY_MS);

  // The user may have edited the number while the request was in flight.
  const current = readKyc().bank;
  if (current.nuban !== bank.nuban || current.status !== 'pending') return;

  const resolved = `${details.firstName} C. ${details.surname}`.toUpperCase();
  setKycBank({ status: 'done', accountName: resolved, error: null });
}

/**
 * Verifies a BVN against NIBSS.
 *
 * TODO: replace with POST /kyc/bvn/verify { bvn }.
 */
export async function verifyBvn() {
  const { bvn, details } = readKyc();
  if (bvn.number.length !== 11) return;

  setKycBvn({ status: 'pending', matchedName: null, error: null });
  await wait(VERIFY_DELAY_MS);

  const current = readKyc().bvn;
  if (current.number !== bvn.number || current.status !== 'pending') return;

  setKycBvn({
    status: 'done',
    matchedName: `${details.firstName} C. ${details.surname}`,
    error: null,
  });
}

let uploadTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Uploads the captured ID document, reporting progress into app state so the
 * bar keeps moving if the user navigates away from step 6 and back.
 *
 * TODO: replace with a multipart POST /kyc/documents and drive `progress` from
 * the request's real upload-progress events instead of a timer.
 */
export function startDocumentUpload(file: { uri: string; fileName: string }) {
  cancelDocumentUpload();

  setKycDocument({
    uri: file.uri,
    fileName: file.fileName,
    progress: UPLOAD_TICK_PERCENT,
    status: 'uploading',
  });

  uploadTimer = setInterval(() => {
    const { document } = readKyc();
    if (document.status !== 'uploading') {
      cancelDocumentUpload();
      return;
    }

    const next = document.progress + UPLOAD_TICK_PERCENT;
    if (next >= 100) {
      cancelDocumentUpload();
      setKycDocument({ progress: 100, status: 'uploaded' });
      return;
    }

    setKycDocument({ progress: next });
  }, UPLOAD_TICK_MS);
}

export function cancelDocumentUpload() {
  if (uploadTimer) clearInterval(uploadTimer);
  uploadTimer = null;
}

/**
 * Hands the completed application over for review.
 *
 * TODO: replace with POST /kyc/submit. The real response decides whether the
 * user lands on "under review" or comes straight back with field errors.
 */
export async function submitKycForReview() {
  setKyc({ status: 'in_review', currentStep: REVIEW_KYC_STEP });
}

/**
 * Jumps an application straight to approved.
 *
 * Only reachable behind `__DEV__`: real approval arrives from the backend,
 * hours later, and the handoff is explicit that the prototype's "simulate
 * approval" link must not ship. It exists so step 8 is reviewable before the
 * API lands, and it goes with the stubs above.
 */
export function simulateApproval() {
  setKyc({ status: 'approved', currentStep: APPROVED_KYC_STEP });
}
