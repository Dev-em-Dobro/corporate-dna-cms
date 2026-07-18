/** Framework-agnostic error types (no next/server import, so tests can use them). */

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
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
