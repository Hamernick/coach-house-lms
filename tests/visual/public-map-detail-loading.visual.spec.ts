import { expect, test } from "@playwright/test"

for (const width of [1440, 390]) {
  test(`Find preserves its shell while resource details load at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addLocatorHandler(
      page.getByRole("button", { name: "Not now", exact: true }),
      async (button) => button.click()
    )
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    page.on("console", (message) => {
      if (message.type() === "error" && /Maximum update depth/.test(message.text())) {
        errors.push(message.text())
      }
    })

    const resource = {
      id: "resource_map:detail-loading-test",
      itemType: "external_resource",
      title: "Detail Loading Pantry",
      description: "Food access for neighbors.",
      latitude: 41.881,
      longitude: -87.629,
      city: "Chicago",
      state: "IL",
      country: "United States",
      primaryResourceCategory: "food",
      resourceCategories: ["food"],
      verificationStatus: "external_data",
      visibility: "published",
    }
    await page.route("**/api/public/resource-map/index?**", (route) =>
      route.fulfill({
        json: {
          page: { hasMore: false, totalCount: 1 },
          resourceItems: [resource],
          version: 2,
        },
      })
    )
    await page.route("**/api/public/resource-map/items/**", (route) =>
      route.fulfill({ json: { resourceItem: resource } })
    )

    let holdChunks = false
    let delayedChunks = 0
    let releaseChunks = () => {}
    const chunksReleased = new Promise<void>((resolve) => {
      releaseChunks = resolve
    })
    await page.route("**/_next/static/chunks/**", async (route) => {
      if (holdChunks && route.request().resourceType() === "script") {
        delayedChunks += 1
        await chunksReleased
      }
      await route.continue()
    })

    try {
      await page.goto("/")
      const drawer = page.getByRole("dialog", { name: "Resource map panel" })
      await expect(drawer).toBeVisible({ timeout: 45_000 })
      await drawer.getByRole("searchbox").fill(resource.title)
      const result = drawer.locator('[data-public-map-result-trigger="true"]')
      await expect(result).toHaveCount(1)
      await expect(result).toBeVisible()
      const mapSurface = page
        .locator("[data-public-map-overscan], [data-public-map-failure-state]")
        .first()
      await expect(mapSurface).toBeVisible()
      const mountedSurface = await mapSurface.elementHandle()

      holdChunks = true
      await result.click()
      await expect.poll(() => delayedChunks).toBeGreaterThan(0)
      // A cold detail import must commit locally, without hiding the whole map
      // behind the route's public-navigation loading fallback.
      await expect(drawer.locator('[data-public-map-drawer-panel="details"]')).toBeVisible()
      await expect(mapSurface).toBeVisible()
      expect(await mountedSurface!.evaluate((element) => element.isConnected)).toBe(true)
      await expect(page.getByLabel("Loading Find")).toHaveCount(0)

      holdChunks = false
      releaseChunks()
      await expect(drawer.getByRole("heading", { name: resource.title, exact: true })).toBeVisible()
      await drawer.getByRole("button", { name: "Back to search" }).click()
      await expect(drawer.getByRole("searchbox")).toBeVisible()
      await drawer.locator('[data-public-map-result-trigger="true"]').click()
      await expect(drawer.getByRole("heading", { name: resource.title, exact: true })).toBeVisible()
      expect(errors).toEqual([])
    } finally {
      holdChunks = false
      releaseChunks()
      await page.unrouteAll({ behavior: "wait" })
    }
  })
}
