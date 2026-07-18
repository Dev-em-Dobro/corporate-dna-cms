import { test, expect } from "@playwright/test";

/**
 * Smoke E2E. Runs only when E2E_BASE_URL points at a running CMS. Full flows
 * (login+MFA, create→preview→publish, restore) map to quickstart V1/V5/V6 and
 * should be expanded once a seeded environment is available.
 */
const RUN = !!process.env.E2E_BASE_URL;

test.describe(RUN ? "smoke" : "smoke (skipped — set E2E_BASE_URL)", () => {
  test.skip(!RUN, "E2E_BASE_URL not set");

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("CMS sign in")).toBeVisible();
  });

  test("unauthenticated admin redirects to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
