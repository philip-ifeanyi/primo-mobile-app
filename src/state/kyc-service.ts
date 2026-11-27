import { File } from 'expo-file-system';
import { messageFor } from '@/api/errors';
import {
  resolveAccount,
  saveDocument,
  saveEmployer,
  saveMedicals,
  verifyBvnNumber,
} from '@/api/kyc';
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
 * Orchestration for the KYC steps: which status each screen shows while a
 * call is in flight, and what it shows when the call comes back.
 *
 * The calls themselves live in src/api/kyc.ts, which decides between the real
 * endpoint and a stub. Nothing here knows which it got, so the wizard behaves
 * the same either way — including on failure.
 */

/** The design's upload: 8% a tick, 110ms apart, so ~1.4s end to end. */
const UPLOAD_TICK_MS = 110;
const UPLOAD_TICK_PERCENT = 8;

/**
 * Base64 inflates bytes by about a third, and this whole string has to fit in
 * one JSON body. 8M characters is roughly a 6MB file — generous for an ID
 * photo, and small enough that the request will not be rejected or time out.
 */
const MAX_DOCUMENT_BASE64_CHARS = 8_000_000;

export type Bank = { code: string; name: string };

/**
 * Fallback list for `fetchBanks`. NIBSS codes, so it is stable enough to
 * hardcode; the real list is longer and changes.
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

/** Asks the bank for the name on an account. */
export async function resolveAccountName() {
  const { bank, details } = readKyc();
  if (bank.nuban.length !== 10 || !bank.bankCode) return;

  setKycBank({ status: 'pending', accountName: null, error: null });

  try {
    const { accountName } = await resolveAccount(
      { bankCode: bank.bankCode, nuban: bank.nuban },
      `${details.firstName} C. ${details.surname}`.toUpperCase()
    );

    // The user may have edited the number while the request was in flight,
    // in which case this answer is about a different account.
    const current = readKyc().bank;
    if (current.nuban !== bank.nuban || current.status !== 'pending') return;

    setKycBank({ status: 'done', accountName, error: null });
  } catch (cause) {
    const current = readKyc().bank;
    if (current.nuban !== bank.nuban || current.status !== 'pending') return;

    setKycBank({ status: 'error', accountName: null, error: messageFor(cause) });
  }
}

/** Verifies a BVN against NIBSS. */
export async function verifyBvn() {
  const { bvn, details } = readKyc();
  if (bvn.number.length !== 11) return;

  setKycBvn({ status: 'pending', matchedName: null, error: null });

  try {
    const { matchedName } = await verifyBvnNumber(
      bvn.number,
      `${details.firstName} C. ${details.surname}`
    );

    const current = readKyc().bvn;
    if (current.number !== bvn.number || current.status !== 'pending') return;

    setKycBvn({ status: 'done', matchedName, error: null });
  } catch (cause) {
    const current = readKyc().bvn;
    if (current.number !== bvn.number || current.status !== 'pending') return;

    setKycBvn({ status: 'error', matchedName: null, error: messageFor(cause) });
  }
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
 * Returns whether it was accepted, so step 6 only advances on success rather
 * than showing "under review" for an application the server never received.
 */
export async function submitKycForReview(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const { employer, medical, document } = readKyc();

  try {
    // The backend has no single "submit" endpoint — each section saves
    // itself. The wizard collects everything first and then writes the
    // sections that the earlier steps did not, in the order the portal does.
    await saveEmployer({
      name: employer.name,
      phone: employer.phone,
      tin: employer.tin,
      address: employer.address,
    });

    await saveMedicals(
      medical.map((answer) => ({
        question: answer.condition,
        selected: answer.hasCondition === true,
      }))
    );

    if (document.uri && document.issuedOn && document.expiresOn) {
      // The API has no upload endpoint; the bytes go inline as base64 and the
      // server stores them. See saveDocument for why.
      const base64 = await new File(document.uri).base64();

      if (base64.length > MAX_DOCUMENT_BASE64_CHARS) {
        return {
          ok: false,
          message:
            'That photo is too large to upload. Please retake it at a lower resolution.',
        };
      }

      await saveDocument({
        base64,
        issueDate: document.issuedOn,
        expiryDate: document.expiresOn,
        type: document.docType,
      });
    }

    setKyc({ status: 'in_review', currentStep: REVIEW_KYC_STEP });
    return { ok: true };
  } catch (cause) {
    return { ok: false, message: messageFor(cause) };
  }
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
