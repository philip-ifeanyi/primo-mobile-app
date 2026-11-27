/** Why a request failed, in terms the UI can branch on. */
export type ApiErrorKind =
  /** Never reached the server: no connection, DNS, TLS. */
  | 'offline'
  /** Reached the server but it took too long to answer. */
  | 'timeout'
  /** 401/403 — the session is no longer good. */
  | 'unauthorized'
  /** 4xx the user can fix, e.g. a BVN that does not match. */
  | 'rejected'
  /** 5xx, or a response we could not parse. */
  | 'server';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  /** Machine-readable code from the backend, when it sends one. */
  readonly code: string | null;

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: { status?: number | null; code?: string | null } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options.status ?? null;
    this.code = options.code ?? null;
  }
}

/**
 * A sentence to put in front of the user.
 *
 * Server-supplied messages are shown only for `rejected`, where they explain
 * something the user can act on. Everything else gets our own wording: a 500's
 * body is for the logs, not for a person.
 */
export function messageFor(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Something went wrong. Please try again.';
  }

  switch (error.kind) {
    case 'offline':
      return 'No connection. Check your network and try again.';
    case 'timeout':
      return 'That took too long. Try again in a moment.';
    case 'unauthorized':
      return 'Your session has expired. Please log in again.';
    case 'rejected':
      return error.message;
    case 'server':
      return 'Our side had a problem. Please try again shortly.';
  }
}
