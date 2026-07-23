import { expect, test, type Page } from "@playwright/test"

async function openBanner(page: Page, colorScheme: "light" | "dark") {
  await page.emulateMedia({ colorScheme, reducedMotion: "reduce" })
  await page.goto("/visual-regression/documents-banner")
  await page.waitForLoadState("networkidle")

  if (colorScheme === "dark") {
    await page.evaluate(() => document.documentElement.classList.add("dark"))
  }
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`documents banner remains centered in ${colorScheme} mode`, async ({
    page,
  }) => {
    await openBanner(page, colorScheme)

    const banner = page.locator(
      '[data-react-grab-owner-id="organization-documents:banner"]'
    )
    await expect(banner).toBeVisible()
    await expect(banner.getByRole("heading")).toHaveText(
      "Store, track, and act on every key document in one place."
    )
    await expect(banner).toHaveScreenshot(
      `documents-banner-${colorScheme}.png`,
      {
        animations: "disabled",
        caret: "hide",
        scale: "css",
        maxDiffPixelRatio: 0.01,
      }
    )
  })
}
