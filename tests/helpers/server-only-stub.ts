/**
 * Test stand-in for the `server-only` package.
 *
 * The real package makes any import from a Client Component a build error.
 * Vitest runs everything in plain Node, where that poison-pill would always
 * fire, so the alias in vitest.config.ts points here instead. The production
 * build keeps the real package and its guarantee.
 */
export {};
