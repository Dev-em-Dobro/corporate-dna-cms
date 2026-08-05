import { describe, it, expect } from "vitest";
import { validateContent, SINGLETON_PAGES, REGISTRY } from "@/lib/content/types";

describe("page_home statistics", () => {
  it("accepts the four statistic fields", () => {
    const r = validateContent("page_home", {
      years: "18",
      countries: "36",
      faculty: "75",
      sponsoredPct: "90%",
    });
    expect(r.ok).toBe(true);
    expect(r.data!.years).toBe("18");
    expect(r.data!.sponsoredPct).toBe("90%");
  });

  it("requires every statistic", () => {
    const r = validateContent("page_home", { years: "18" });
    expect(r.ok).toBe(false);
    expect(r.errors!.countries).toBeDefined();
    expect(r.errors!.faculty).toBeDefined();
    expect(r.errors!.sponsoredPct).toBeDefined();
  });

  it("rejects an empty statistic string", () => {
    const r = validateContent("page_home", {
      years: "",
      countries: "36",
      faculty: "75",
      sponsoredPct: "90%",
    });
    expect(r.ok).toBe(false);
    expect(r.errors!.years).toBeDefined();
  });

  it("is registered as the 'home' singleton", () => {
    expect(SINGLETON_PAGES.home).toEqual({ type: "page_home", slug: "home" });
  });

  it("labels the singleton 'Home statistics' in list projections", () => {
    expect(REGISTRY.page_home.toListItem({}).title).toBe("Home statistics");
  });
});
