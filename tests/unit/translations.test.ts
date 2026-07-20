import { describe, it, expect } from "vitest";
import {
  groupByTranslationGroup,
  missingLocales,
  type ListVariant,
} from "@/lib/content/translations";

function v(over: Partial<ListVariant>): ListVariant {
  return {
    id: "id",
    locale: "en",
    status: "draft",
    title: "T",
    updatedAt: "2026-01-01T00:00:00.000Z",
    translationGroupId: "g1",
    ...over,
  };
}

describe("groupByTranslationGroup", () => {
  it("collapses locale variants of one group into a single item", () => {
    const items = [
      v({ id: "a", locale: "en", title: "Hello", translationGroupId: "g1" }),
      v({ id: "b", locale: "pt-BR", title: "Olá", translationGroupId: "g1" }),
      v({ id: "c", locale: "en", title: "Other", translationGroupId: "g2" }),
    ];
    const groups = groupByTranslationGroup(items, "en");
    expect(groups).toHaveLength(2);
    const g1 = groups[0];
    expect(g1.variants).toHaveLength(2);
    // Title/primaryId come from the default-locale (en) variant.
    expect(g1.title).toBe("Hello");
    expect(g1.primaryId).toBe("a");
  });

  it("falls back to the first variant when the default locale is absent", () => {
    const items = [
      v({ id: "x", locale: "pt-BR", title: "Só PT", translationGroupId: "g9" }),
    ];
    const [g] = groupByTranslationGroup(items, "en");
    expect(g.title).toBe("Só PT");
    expect(g.primaryId).toBe("x");
  });

  it("preserves group order by first appearance", () => {
    const items = [
      v({ translationGroupId: "gB" }),
      v({ translationGroupId: "gA" }),
    ];
    expect(groupByTranslationGroup(items, "en").map((g) => g.translationGroupId)).toEqual([
      "gB",
      "gA",
    ]);
  });
});

describe("missingLocales", () => {
  const active = [
    { code: "en", label: "English" },
    { code: "pt-BR", label: "Português (Brasil)" },
    { code: "es", label: "Español" },
  ];

  it("returns active languages not already present", () => {
    expect(missingLocales(["en"], active).map((l) => l.code)).toEqual(["pt-BR", "es"]);
  });

  it("returns empty when all languages exist", () => {
    expect(missingLocales(["en", "pt-BR", "es"], active)).toEqual([]);
  });
});
