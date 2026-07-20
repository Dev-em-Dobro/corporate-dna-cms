import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  shouldSave,
  createAutosaveScheduler,
  AUTOSAVE_DELAY_MS,
} from "@/lib/content/autosave";

describe("shouldSave", () => {
  const ok = { dirty: true, hasId: true, inFlight: false, payloadValid: true };

  it("allows saving when all conditions hold", () => {
    expect(shouldSave(ok)).toBe(true);
  });

  it("blocks when not dirty", () => {
    expect(shouldSave({ ...ok, dirty: false })).toBe(false);
  });

  it("blocks a brand-new (id-less) entry", () => {
    expect(shouldSave({ ...ok, hasId: false })).toBe(false);
  });

  it("blocks while a write is in flight", () => {
    expect(shouldSave({ ...ok, inFlight: true })).toBe(false);
  });

  it("blocks when the payload is invalid", () => {
    expect(shouldSave({ ...ok, payloadValid: false })).toBe(false);
  });
});

describe("createAutosaveScheduler", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires once after the debounce delay", () => {
    const fire = vi.fn();
    const s = createAutosaveScheduler(fire);
    s.schedule();
    expect(fire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("coalesces rapid changes into a single save (resets the window)", () => {
    const fire = vi.fn();
    const s = createAutosaveScheduler(fire);
    s.schedule();
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS - 1);
    s.schedule(); // reset before it fired
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS - 1);
    expect(fire).not.toHaveBeenCalled(); // first window never elapsed
    vi.advanceTimersByTime(1);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("flush fires immediately when a save is pending", () => {
    const fire = vi.fn();
    const s = createAutosaveScheduler(fire);
    s.schedule();
    s.flush();
    expect(fire).toHaveBeenCalledTimes(1);
    // The pending timer was consumed — advancing does not fire again.
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("flush does nothing when no save is pending", () => {
    const fire = vi.fn();
    const s = createAutosaveScheduler(fire);
    s.flush();
    expect(fire).not.toHaveBeenCalled();
  });

  it("cancel drops a pending save without firing", () => {
    const fire = vi.fn();
    const s = createAutosaveScheduler(fire);
    s.schedule();
    s.cancel();
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
    expect(fire).not.toHaveBeenCalled();
    expect(s.pending()).toBe(false);
  });
});
