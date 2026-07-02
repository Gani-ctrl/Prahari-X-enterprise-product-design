/** Shared error type used by both the mock and real API implementations. */
export class ApiError extends Error {
  status: number;
  /** Machine-readable error code (e.g. "ACCOUNT_NOT_FOUND", "INVALID_CREDENTIALS") so the UI can branch without parsing message strings. */
  code?: string;
  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
