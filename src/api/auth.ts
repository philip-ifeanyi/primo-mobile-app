import { request } from './client';
import { IS_API_CONFIGURED, TENANT_ID } from './config';
import { ApiError } from './errors';
import type { Tokens } from './tokens';

/**
 * Authentication against the ABP backend.
 *
 * Endpoints and payloads mirror primo-portal-nextjs (src/apis/auth.api.ts and
 * src/components/pages/register/Step1.tsx), which is the only contract we
 * have; there is no spec.
 *
 * Two places where the backend does not match the mobile design:
 *
 *  1. Registering does NOT return a session. The portal registers, sends an
 *     email activation link, and makes the user log in afterwards. To keep
 *     the designed signup -> OTP -> home flow, `signUp` registers and then
 *     authenticates with the same credentials. If the deployment refuses to
 *     issue a token before the email is confirmed, that surfaces as the
 *     server's own message rather than a silent failure.
 *  2. The SMS OTP endpoints live under Profile and need a bearer token, so
 *     they are a post-login step, not part of registration. That is why
 *     `sendOtp`/`verifyOtp` are not anonymous.
 */

export type Credentials = { email: string; password: string };

export type SignUpPayload = Credentials & {
  /** Local format, 10 digits after +234. */
  phone: string;
  referralCode?: string;
};

export type Profile = {
  firstName: string;
  lastName: string;
  email: string;
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** ABP's /TokenAuth/Authenticate result. */
type AuthenticateResult = {
  accessToken: string;
  encryptedAccessToken?: string;
  expireInSeconds?: number;
  userId?: number;
};

/** ABP's Profile/GetCurrentUserProfileForEdit result. */
type ProfileResult = {
  name?: string;
  surname?: string;
  emailAddress?: string;
  userName?: string;
  phoneNumber?: string;
};

function toTokens(result: AuthenticateResult): Tokens {
  return {
    accessToken: result.accessToken,
    expiresAt: result.expireInSeconds
      ? Date.now() + result.expireInSeconds * 1000
      : null,
    userId: result.userId ?? null,
  };
}

/**
 * Stand-in used while no base URL is configured. The token is obviously fake
 * so nothing downstream mistakes it for a real credential.
 */
async function stubTokens(): Promise<Tokens> {
  await wait(900);
  return {
    accessToken: `stub-access-${Date.now()}`,
    expiresAt: Date.now() + 60 * 60 * 1000,
    userId: null,
  };
}

/** POST /TokenAuth/Authenticate */
export async function logIn(credentials: Credentials): Promise<Tokens> {
  if (!IS_API_CONFIGURED) return stubTokens();

  const result = await request<AuthenticateResult>('/TokenAuth/Authenticate', {
    method: 'POST',
    anonymous: true,
    body: {
      userNameOrEmailAddress: credentials.email,
      password: credentials.password,
      tenantId: TENANT_ID,
    },
  });

  return toTokens(result);
}

/**
 * POST services/app/Account/Register, then authenticate.
 *
 * `captchaResponse` is the literal the portal sends; this deployment does not
 * validate it.
 */
export async function signUp(payload: SignUpPayload): Promise<Tokens> {
  if (!IS_API_CONFIGURED) return stubTokens();

  await request<unknown>('/services/app/Account/Register', {
    method: 'POST',
    anonymous: true,
    body: {
      // The design collects one email and password, not a name, so the
      // username is derived the same way the portal derives it.
      name: payload.email.split('@')[0],
      surname: '',
      userName: payload.email.split('@')[0],
      emailAddress: payload.email,
      password: payload.password,
      captchaResponse: 'correct',
      referralCode: payload.referralCode ?? null,
    },
  });

  return logIn({ email: payload.email, password: payload.password });
}

/** GET services/app/Profile/GetCurrentUserProfileForEdit */
export async function getProfile(): Promise<Profile> {
  if (!IS_API_CONFIGURED) {
    await wait(300);
    return {
      firstName: 'Adaeze',
      lastName: 'Okonkwo',
      email: 'adaeze.okonkwo@gmail.com',
    };
  }

  const result = await request<ProfileResult>(
    '/services/app/Profile/GetCurrentUserProfileForEdit'
  );

  return {
    firstName: result.name ?? '',
    lastName: result.surname ?? '',
    email: result.emailAddress ?? '',
  };
}

/** POST services/app/Profile/SendVerificationSms — needs a bearer token. */
export async function sendOtp(phone: string): Promise<void> {
  if (!IS_API_CONFIGURED) {
    await wait(600);
    return;
  }

  await request<void>('/services/app/Profile/SendVerificationSms', {
    method: 'POST',
    body: { phoneNumber: `+234${phone}` },
  });
}

/** POST services/app/Profile/VerifySmsCode — needs a bearer token. */
export async function verifyOtp(phone: string, code: string): Promise<void> {
  if (!IS_API_CONFIGURED) {
    await wait(900);
    // Gives the OTP screen a reachable failure path while stubbed.
    if (code === '000000') {
      throw new ApiError('rejected', 'That code is not right. Try again.');
    }
    return;
  }

  await request<void>('/services/app/Profile/VerifySmsCode', {
    method: 'POST',
    body: { phoneNumber: `+234${phone}`, code },
  });
}

/**
 * There is no server-side logout on this backend — the portal simply drops
 * the token from storage. Kept as a function so the call site reads the same
 * either way, and so a real revocation endpoint has an obvious home.
 */
export async function logOut(): Promise<void> {
  return Promise.resolve();
}
