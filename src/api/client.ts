import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';
import { ApiError } from './errors';
import { clearTokens, peekTokens } from './tokens';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

type RequestOptions = {
  method?: Method;
  body?: unknown;
  /** Skip the Authorization header — for login and registration. */
  anonymous?: boolean;
  signal?: AbortSignal;
};

/**
 * ABP wraps every response, success or failure, in this envelope.
 *
 * The important part: a rejected request still comes back as HTTP 200 with
 * `success: false` and `error` populated. Checking `response.ok` alone would
 * read a failed BVN check as a successful one.
 */
type AbpEnvelope<T> = {
  result: T | null;
  targetUrl: string | null;
  success: boolean;
  error?: {
    code?: number;
    message?: string;
    details?: string | null;
    validationErrors?: { message: string; members: string[] }[] | null;
  } | null;
  unAuthorizedRequest: boolean;
  __abp?: boolean;
};

/** Called when the session is no longer good, so the app can sign out. */
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // A non-JSON body from a JSON API means something upstream answered
    // instead — a proxy error page, a captive portal.
    return null;
  }
}

/** Prefers ABP's field-level validation message over the generic one. */
function abpMessage(error: AbpEnvelope<unknown>['error']): string {
  const first = error?.validationErrors?.[0]?.message;
  return first ?? error?.message ?? error?.details ?? 'Request failed.';
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const { method = 'GET', body, anonymous = false, signal } = options;

  // Matching the portal: this ABP deployment is configured for the
  // json-patch content type and will 415 on plain application/json.
  const headers: Record<string, string> = { Accept: '*/*' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json-patch+json';
  }

  if (!anonymous) {
    const tokens = peekTokens();
    if (tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  // AbortController rather than Promise.race: race leaves the request running
  // and its socket open after the timeout fires.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Caller cancellation (a screen unmounting) folds into the same signal.
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted) {
      throw new ApiError('timeout', 'The request timed out.');
    }
    throw new ApiError('offline', 'Could not reach the server.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

async function endSession(message: string, status: number | null): Promise<never> {
  // No refresh endpoint exists on this backend, so an expired or rejected
  // token means logging in again — there is nothing to retry with.
  await clearTokens();
  onSessionExpired?.();
  throw new ApiError('unauthorized', message, { status });
}

/**
 * One JSON request, unwrapped from the ABP envelope.
 *
 * Returns `result`, so callers deal in the payload rather than the wrapper.
 */
export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await send(path, options);
  const body = (await readBody(response)) as AbpEnvelope<T> | null;

  if (response.status === 401 || response.status === 403) {
    return endSession(abpMessage(body?.error), response.status);
  }

  // The envelope's own auth flag, which ABP sets on a 200 as well.
  if (body?.unAuthorizedRequest) {
    return endSession(abpMessage(body.error), response.status);
  }

  // A rejected request arrives as 200 with success false; this is the check
  // that response.ok alone would miss.
  if (body && body.__abp !== undefined && !body.success) {
    throw new ApiError('rejected', abpMessage(body.error), {
      status: response.status,
      code: body.error?.code != null ? String(body.error.code) : null,
    });
  }

  if (!response.ok) {
    const message = abpMessage(body?.error);
    throw new ApiError(response.status >= 500 ? 'server' : 'rejected', message, {
      status: response.status,
      code: body?.error?.code != null ? String(body.error.code) : null,
    });
  }

  // Endpoints that return nothing meaningful still send an envelope with a
  // null result; callers type those as void.
  return (body?.result ?? null) as T;
}
