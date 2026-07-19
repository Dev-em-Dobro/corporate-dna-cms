/**
 * Shared control styles. Every interactive control clears the 44×44px touch
 * target from WCAG 2.5.5 via `min-h-11` (44px) — `text-xs px-1` controls were
 * landing around 20px.
 */

export const input =
  "min-h-11 w-full rounded border border-line-strong bg-white px-3 text-sm text-ink placeholder:text-muted transition-colors duration-150 focus:border-brand-dark";

export const textarea =
  "w-full rounded border border-line-strong bg-white px-3 py-2 text-sm text-ink placeholder:text-muted transition-colors duration-150 focus:border-brand-dark";

export const select =
  "min-h-11 rounded border border-line-strong bg-white px-2 text-sm text-ink transition-colors duration-150 focus:border-brand-dark";

/* brand-dark, not brand: white on #d84339 is 4.39:1 and fails AA at 14px.
   #b5342b carries the same brand hue at 6.02:1. */
export const buttonPrimary =
  "inline-flex min-h-11 items-center justify-center rounded bg-brand-dark px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-darker disabled:cursor-not-allowed disabled:opacity-60";

export const buttonDark =
  "inline-flex min-h-11 items-center justify-center rounded bg-ink px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-black disabled:cursor-not-allowed disabled:opacity-60";

export const buttonSecondary =
  "inline-flex min-h-11 items-center justify-center rounded border border-line-strong px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60";

/** Low-emphasis action that still needs a full touch target. */
export const buttonQuiet =
  "inline-flex min-h-11 items-center justify-center rounded px-3 text-sm font-medium text-ink transition-colors duration-150 hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60";

export const buttonDanger =
  "inline-flex min-h-11 items-center justify-center rounded px-3 text-sm font-medium text-danger transition-colors duration-150 hover:bg-danger-surface disabled:cursor-not-allowed disabled:opacity-60";
