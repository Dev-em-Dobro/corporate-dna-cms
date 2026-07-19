/**
 * Test stand-in for `next/headers` (aliased in vitest.config.ts).
 *
 * `cookies()` in Next.js is scoped to the current request. Tests have no
 * request, so this module provides one mutable jar that plays the role of the
 * "current browser": Supabase's SSR client writes session cookies into it on
 * sign-in and reads them back inside guards and route handlers.
 *
 * Multiple "devices" are modelled by swapping jars with `useJar()`. Reset
 * between users with `resetCookies()` or cross-user cookie bleed will make
 * tests pass (or fail) for the wrong reason.
 */

interface StoredCookie {
  name: string;
  value: string;
}

interface CookieSetOptions {
  maxAge?: number;
  expires?: Date | number;
}

export class TestCookieJar {
  private store = new Map<string, string>();

  getAll(): StoredCookie[] {
    return [...this.store.entries()].map(([name, value]) => ({ name, value }));
  }

  get(name: string): StoredCookie | undefined {
    const value = this.store.get(name);
    return value === undefined ? undefined : { name, value };
  }

  has(name: string): boolean {
    return this.store.has(name);
  }

  set(name: string, value: string, options?: CookieSetOptions): void {
    // Supabase clears cookies by writing an empty value with maxAge 0 —
    // treat that as deletion, like a browser would.
    const expiresAt =
      options?.expires instanceof Date
        ? options.expires.getTime()
        : options?.expires;
    const expired =
      options?.maxAge === 0 ||
      (typeof expiresAt === "number" && expiresAt <= Date.now());
    if (expired || value === "") {
      this.store.delete(name);
    } else {
      this.store.set(name, value);
    }
  }

  delete(name: string): void {
    this.store.delete(name);
  }

  clone(): TestCookieJar {
    const jar = new TestCookieJar();
    for (const [k, v] of this.store) jar.store.set(k, v);
    return jar;
  }

  get size(): number {
    return this.store.size;
  }
}

let current = new TestCookieJar();

/** Fresh anonymous "browser" — call before signing in as a different user. */
export function resetCookies(): TestCookieJar {
  current = new TestCookieJar();
  return current;
}

/** The jar the app code is currently reading/writing. */
export function currentJar(): TestCookieJar {
  return current;
}

/** Switch to another jar (simulates a second device/browser). */
export function useJar(jar: TestCookieJar): void {
  current = jar;
}

// --- The next/headers surface the app actually uses -------------------------

export async function cookies(): Promise<TestCookieJar> {
  return current;
}

export async function headers(): Promise<Headers> {
  return new Headers();
}
