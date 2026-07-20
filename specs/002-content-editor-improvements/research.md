# Phase 0 Research: Content Editor Improvements

No open `[NEEDS CLARIFICATION]` remained from the spec (both were resolved with the user). Research here covers the few technical patterns the implementation depends on.

## R1 — Reflecting a restored version in an uncontrolled Quill editor

**Decision**: After a restore, force the affected editor fields to remount by changing a React `key` (a per-form `revision` counter). Controlled `<input>/<textarea>` update from state automatically; the Quill editor does not, because it seeds content only on mount.

**Rationale**: `RichTextEditor` is intentionally uncontrolled after init (Quill owns its DOM). Making it fully controlled would fight Quill's cursor/selection handling and risk update loops. Remounting via `key` is the standard React escape hatch for "re-initialize this subtree with new initial data" and keeps the editor simple. The restore is a rare, explicit action, so a remount cost is negligible.

**Alternatives considered**:
- *Imperatively `setContents`/`dangerouslyPasteHTML` on the existing instance*: possible, but requires exposing an imperative handle and carefully suppressing the resulting `text-change` (which would mark the form dirty). More moving parts than a `key` bump.
- *Fully controlled Quill*: rejected — known source of caret jumps and infinite update loops.

## R2 — Auto-save trigger: debounce + blur, coordinated with manual save

**Decision**: A debounced timer (~10s) restarted on every change, plus an immediate flush on field blur. A single shared `saving` in-flight flag gates all write paths (manual, auto, restore). Extract the pure scheduling decision (`should we save now?`, timer/coalesce bookkeeping) into `lib/content/autosave.ts` so it is unit-testable without a DOM.

**Rationale**: Matches the user's "blur or every ~10s after a change". Debounce coalesces bursts of keystrokes into one save (FR-010). The blur flush gives fast persistence when the user tabs away. A shared in-flight flag is the simplest way to guarantee no overlapping/duplicate writes (FR-011/FR-012). Keeping the decision logic pure avoids brittle timer-based component tests.

**Alternatives considered**:
- *Interval polling every 10s regardless of activity*: wasteful and saves when nothing changed.
- *Save on every change (no debounce)*: hammers the API and the version table.
- *A third-party autosave/form library*: unnecessary dependency for a small, well-understood behavior (YAGNI).

## R3 — Concurrency token handling across write paths

**Decision**: Continue sending `expectedVersionId` on every PUT and update it from each successful response (`currentVersionId`). Restore returns the full updated entry, so its `currentVersionId` becomes the new token. Auto-save and manual save read/update the same token state.

**Rationale**: The optimistic-concurrency guard already exists in `updateEntry` and the editor. Auto-save is just another caller; as long as it updates the token from responses, it won't conflict with manual save or restore. On a genuine 409 (someone else changed the entry), surface the existing "reload to get their changes" message and pause auto-save.

**Alternatives considered**:
- *Disable the concurrency guard for auto-save*: rejected — reintroduces silent-overwrite risk the guard was built to prevent.

## R4 — Auto-save behavior for brand-new (never-saved) entries

**Decision**: Auto-save engages only once the entry has an `id`. For a new entry, the first "Save draft" (manual, which POSTs and creates the entry) bootstraps it; afterward auto-save takes over.

**Rationale**: Prevents accidental creation of empty/junk drafts from incidental focus or a stray keystroke on a blank form. Aligns with the Assumptions in the spec.

**Alternatives considered**:
- *Auto-create on first change*: rejected — would create empty drafts and complicate the "unsaved changes" story for never-touched forms.

## R5 — Increasing editor height

**Decision**: Give the Quill editable area a larger min-height via a prop/class on `RichTextEditor` (its `.ql-editor`/container min-height). Keep it responsive (min-height, not fixed height) so it still grows with content and doesn't break small viewports.

**Rationale**: Directly satisfies FR-016/FR-017 with a CSS-only change scoped to the rich-text fields. Using min-height preserves the existing auto-grow behavior and the sticky action bar.

**Alternatives considered**:
- *Fixed pixel height*: rejected — clips long content and hurts small screens.
