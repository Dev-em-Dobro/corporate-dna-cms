/** Framework-agnostic error types (no next/server import, so tests can use them). */

/**
 * `next` tells the caller where to send the user instead of dead-ending:
 * "mfa" when a factor exists but has not been satisfied this session, "enrol"
 * when no factor exists yet. Supabase's guidance is to redirect to
 * re-authentication rather than reject outright.
 */
export type AuthNext = "mfa" | "enrol";

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
    public next?: AuthNext,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export class ConflictError extends Error {
  constructor(message = "Edit conflict — the entry changed since you loaded it") {
    super(message);
    this.name = "ConflictError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}
