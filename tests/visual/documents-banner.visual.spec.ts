import { expect, test, type Page } from "@playwright/test"

async function openBanner(page: Page, colorScheme: "light" | "dark") {
  // Keep the local development toolbar out of product baselines.
  await page.route("https://unpkg.com/react-grab@*/**", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" })
  )
  await page.emulateMedia({ colorScheme, reducedMotion: "reduce" })
  await page.goto("/visual-regression/documents-banner")
  await page.waitForLoadState("networkidle")

  if (colorScheme === "dark") {
    await page.evaluate(() => document.documentElement.classList.add("dark"))
  }
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`documents library remains responsive in ${colorScheme} mode`, async ({
    page,
  }) => {
    await openBanner(page, colorScheme)

    const banner = page.locator(
      '[data-react-grab-owner-id="organization-documents:banner"]'
    )
    await expect(banner).toBeVisible()
    await expect(
      banner.getByRole("heading", { name: "Documents" })
    ).toBeVisible()
    await expect(banner).toHaveScreenshot(
      `documents-banner-${colorScheme}.png`,
      {
        animations: "disabled",
        caret: "hide",
        scale: "css",
        maxDiffPixelRatio: 0.04,
      }
    )
  })
}
