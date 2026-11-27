import { request } from './client';
import { IS_API_CONFIGURED } from './config';
import { ApiError } from './errors';

/**
 * Transport for the KYC steps, mirroring primo-portal-nextjs
 * (src/apis/user.api.ts and src/apis/getverification.api.ts).
 *
 * Orchestration — which status each screen shows while a call is in flight —
 * stays in src/state/kyc-service.ts, so neither layer knows the other's
 * concerns. Each function is either the live call or its stub, chosen once by
 * IS_API_CONFIGURED.
 */

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export type Bank = { code: string; name: string };

/** ABP paged list envelope, inside the usual `result`. */
type Paged<T> = { totalCount: number; items: T[] };

/**
 * GET services/app/bank/getall?MaxResultCount=300
 *
 * The portal asks for 300 in one page rather than paging, so this does too.
 * Falls back to the bundled list if the call fails: a bank picker with no
 * banks would dead-end the whole wizard.
 */
export async function fetchBanks(fallback: Bank[]): Promise<Bank[]> {
  if (!IS_API_CONFIGURED) return fallback;

  try {
    const result = await request<Paged<Record<string, unknown>>>(
      '/services/app/bank/getall?MaxResultCount=300'
    );

    const banks = (result?.items ?? [])
      .map((item) => ({
        // The portal never names these fields; both spellings are accepted
        // until the shape is confirmed against a live response.
        code: String(item.code ?? item.bankCode ?? item.id ?? ''),
        name: String(item.name ?? item.bankName ?? ''),
      }))
      .filter((bank) => bank.code !== '' && bank.name !== '');

    return banks.length > 0 ? banks : fallback;
  } catch {
    return fallback;
  }
}

/**
 * POST services/app/Nuban/Verify
 *
 * Response shape confirmed against the backend's own swagger:
 * { countryCode, accountNumber, accountName, accountType, documentType,
 *   documentNumber }. `accountName` is the only name field, so the fallbacks
 * below are belt-and-braces rather than guesswork.
 */
export async function resolveAccount(
  input: { bankCode: string; nuban: string },
  stubName: string
): Promise<{ accountName: string }> {
  if (!IS_API_CONFIGURED) {
    await wait(1400);
    if (input.nuban === '0000000000') {
      throw new ApiError('rejected', 'That account number was not found.');
    }
    return { accountName: stubName };
  }

  const result = await request<Record<string, unknown>>(
    '/services/app/Nuban/Verify',
    { method: 'POST', body: { nuban: input.nuban, bankCode: input.bankCode } }
  );

  const accountName =
    (result?.accountName as string) ??
    (result?.name as string) ??
    (result?.fullName as string) ??
    '';

  if (!accountName) {
    throw new ApiError('rejected', 'The bank did not return a name for that account.');
  }

  return { accountName };
}

/**
 * POST services/app/Bvn/Verify
 *
 * Returns a whole BVN record, and the name field is `fullname` — all
 * lowercase, as NIBSS spells it. This previously looked for `fullName`,
 * `name` and `matchedName`, none of which the endpoint returns, so a
 * *successful* verification fell through to the "did not return a name"
 * error. Composing from the parts is the fallback, since those are present
 * too and a blank `fullname` has been seen in the wild.
 */
export async function verifyBvnNumber(
  bvn: string,
  stubName: string
): Promise<{ matchedName: string }> {
  if (!IS_API_CONFIGURED) {
    await wait(2200);
    if (bvn === '00000000000') {
      throw new ApiError('rejected', "That BVN doesn't match your details.");
    }
    return { matchedName: stubName };
  }

  const result = await request<Record<string, unknown>>(
    '/services/app/Bvn/Verify',
    { method: 'POST', body: { bvn } }
  );

  const parts = [result?.firstname, result?.middlename, result?.lastname]
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .join(' ');

  const matchedName = ((result?.fullname as string) || parts || '').trim();

  if (!matchedName) {
    throw new ApiError('rejected', 'NIBSS did not return a name for that BVN.');
  }

  return { matchedName };
}

export type EmployerPayload = {
  name: string;
  phone: string;
  tin: string;
  address: string;
};

/** POST services/app/employer/save */
export async function saveEmployer(payload: EmployerPayload): Promise<void> {
  if (!IS_API_CONFIGURED) {
    await wait(600);
    return;
  }

  await request<void>('/services/app/employer/save', {
    method: 'POST',
    body: {
      name: payload.name,
      description: payload.name,
      company: payload.name,
      companyAddress: payload.address,
      companyCountry: 'Nigeria',
      taxNumber: payload.tin,
      mobileNo: payload.phone,
    },
  });
}

export type MedicalAnswerPayload = { question: string; selected: boolean };

/** POST services/app/Medical/Save */
export async function saveMedicals(
  medicalAnswers: MedicalAnswerPayload[]
): Promise<void> {
  if (!IS_API_CONFIGURED) {
    await wait(600);
    return;
  }

  await request<void>('/services/app/Medical/Save', {
    method: 'POST',
    body: { medicalAnswers },
  });
}

/**
 * ABP's DocumentTypes enum, which `Document/Save` takes as an integer. The
 * misspelling of "Passort" is the backend's, preserved here deliberately: the
 * name only has to match on our side, but renaming it would hide the fact
 * that it mirrors a server-side typo.
 */
export const DOCUMENT_TYPES = {
  PassortPhoto: 0,
  InternationalPassort: 1,
  NationalId: 2,
  DriversLicense: 3,
  Signature: 4,
  Others: 5,
} as const;

export type DocumentTypeName = keyof typeof DOCUMENT_TYPES;

export type DocumentPayload = {
  /**
   * The file's bytes as base64, WITHOUT a `data:` URI prefix. The server
   * decodes this and stores the file itself, returning the URL it assigned.
   */
  base64: string;
  issueDate: string;
  expiryDate: string;
  type: DocumentTypeName;
};

/**
 * POST services/app/Document/Save
 *
 * The field is called `data` and the response contains a `url`, which reads
 * like it wants a URL — it does not. There is no file-upload endpoint
 * anywhere in this API (all 359 paths were checked; none accepts multipart or
 * octet-stream). The portal proves the intent: it runs the chosen file
 * through FileReader.readAsDataURL, strips everything up to and including
 * `base64,`, and sends the remainder in `data`. So the bytes travel inline as
 * base64 and the server does the storing.
 *
 * Two consequences worth knowing. The payload is ~33% larger than the file,
 * so a full-resolution phone photo can be several megabytes of JSON — the
 * capture screen should downscale before calling this. And `type` is an
 * integer enum; the portal sends the enum *name* as a string and relies on
 * ASP.NET's converter accepting it, which is undocumented behaviour, so this
 * sends the integer the schema actually specifies.
 */
export async function saveDocument(
  payload: DocumentPayload
): Promise<{ url: string; id: number } | null> {
  if (!IS_API_CONFIGURED) {
    await wait(600);
    return null;
  }

  // Tolerate a full data URI being passed in, since that is the easy mistake
  // to make here and the server would store the prefix as if it were image data.
  const comma = payload.base64.indexOf('base64,');
  const data = comma === -1 ? payload.base64 : payload.base64.slice(comma + 7);

  const result = await request<{ url?: string; id?: number }>(
    '/services/app/Document/Save',
    {
      method: 'POST',
      body: {
        data,
        issueDate: payload.issueDate,
        expiryDate: payload.expiryDate,
        type: DOCUMENT_TYPES[payload.type],
      },
    }
  );

  return { url: result?.url ?? '', id: result?.id ?? 0 };
}

/**
 * GET services/app/Kyc/GetAll
 *
 * There is no single "submit for review" endpoint: each section saves itself,
 * and this reports where the application stands.
 */
export async function fetchKycStatus(): Promise<unknown> {
  if (!IS_API_CONFIGURED) {
    await wait(400);
    return null;
  }
  return request<unknown>('/services/app/Kyc/GetAll');
}
