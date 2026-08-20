import { expect, test, type Page } from "@playwright/test"

async function openFindLoading(
  page: Page,
  {
    colorScheme,
    height,
    width,
  }: {
    colorScheme: "light" | "dark"
    height: number
    width: number
  }
) {
  await page.setViewportSize({ width, height })
  await page.emulateMedia({ colorScheme, reducedMotion: "reduce" })
  await page.goto("/visual-regression/find-loading")

  if (colorScheme === "dark") {
    await page.evaluate(() => document.documentElement.classList.add("dark"))
  }

  const loadingSurface = page.locator("[data-find-map-loading-state]")
  await expect(loadingSurface).toBeVisible()
  return loadingSurface
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`Find loading matches the ${viewport.name} ${colorScheme} layout`, async ({
      page,
    }) => {
      const loadingSurface = await openFindLoading(page, {
        colorScheme,
        height: viewport.height,
        width: viewport.width,
      })

      expect(
        await loadingSurface.evaluate(
          (element) =>
            element.scrollWidth <= element.clientWidth &&
            element.scrollHeight <= element.clientHeight
        )
      ).toBe(true)
      await expect(page).toHaveScreenshot(
        `find-loading-${viewport.name}-${colorScheme}.png`,
        {
          animations: "disabled",
          caret: "hide",
          scale: "css",
          maxDiffPixelRatio: 0.02,
        }
      )
    })
  }
}
