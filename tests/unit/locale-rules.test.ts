import { describe, it, expect } from "vitest";
import {
  resolveDefault,
  sortLocales,
  canDisable,
  canDelete,
  nextDefaultSwap,
} from "@/lib/content/locale-rules";
import type { Locale } from "@/db/schema";

function loc(over: Partial<Locale>): Locale {
  return {
    code: "en",
    label: "English",
    isDefault: false,
    enabled: true,
    sortOrder: 0,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...over,
  };
}

describe("resolveDefault", () => {
  it("returns the flagged default", () => {
    expect(
      resolveDefault([loc({ code: "en" }), loc({ code: "pt-BR", isDefault: true })]),
    ).toBe("pt-BR");
  });
  it("falls back to the first, then to en", () => {
    expect(resolveDefault([loc({ code: "fr" }), loc({ code: "de" })])).toBe("fr");
    expect(resolveDefault([])).toBe("en");
  });
});

describe("sortLocales", () => {
  it("orders by sortOrder then code", () => {
    const out = sortLocales([
      loc({ code: "es", sortOrder: 2 }),
      loc({ code: "en", sortOrder: 0 }),
      loc({ code: "pt-BR", sortOrder: 0 }),
    ]);
    expect(out.map((l) => l.code)).toEqual(["en", "pt-BR", "es"]);
  });
});

describe("canDisable", () => {
  const locales = [loc({ code: "en", isDefault: true }), loc({ code: "pt-BR" })];
  it("blocks the default, allows the rest", () => {
    expect(canDisable("en", locales)).toBe(false);
    expect(canDisable("pt-BR", locales)).toBe(true);
  });
});

describe("canDelete", () => {
  it("only when neither default nor in use", () => {
    expect(canDelete({ isDefault: false }, 0)).toBe(true);
    expect(canDelete({ isDefault: false }, 3)).toBe(false);
    expect(canDelete({ isDefault: true }, 0)).toBe(false);
  });
});

describe("nextDefaultSwap", () => {
  it("moves the default to exactly one language", () => {
    const out = nextDefaultSwap(
      [loc({ code: "en", isDefault: true }), loc({ code: "pt-BR" })],
      "pt-BR",
    );
    expect(out.filter((l) => l.isDefault).map((l) => l.code)).toEqual(["pt-BR"]);
  });
});
