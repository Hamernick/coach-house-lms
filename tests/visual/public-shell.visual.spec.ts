import { expect, test, type Page } from "@playwright/test"

async function stabilizeForScreenshot(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }

      * {
        scrollbar-width: none !important;
      }

      *::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }

      [data-testid="react-grab-overlay"] {
        display: none !important;
      }

      [data-home-canvas-hero-media],
      [data-home-canvas-hero-copy] > *,
      [data-home-canvas-reveal],
      [data-marketplace-intro],
      [data-marketplace-hero-line] {
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
      }

      [data-home-map-preview-map] {
        display: none !important;
      }

      [data-home-map-preview-fallback] {
        opacity: 1 !important;
        visibility: visible !important;
      }
    `,
  })

  await page.waitForTimeout(100)
}

async function waitForHomeCanvasHydration(page: Page) {
  await page.waitForFunction(() => {
    const panel = document.querySelector("[data-home-canvas-panel]")
    return Object.keys(panel ?? {}).some((key) =>
      key.startsWith("__reactProps$")
    )
  })
}

async function waitForMarketplaceLiveCount(page: Page) {
  await expect(
    page.locator("[data-marketplace-live-count]")
  ).not.toHaveAttribute("data-marketplace-live-count", "loading")
}

test("marketplace public home", async ({ page }) => {
  await page.goto("/")
  await page.waitForSelector("[data-marketplace-hero]", { state: "visible" })
  await waitForMarketplaceLiveCount(page)
  await stabilizeForScreenshot(page)

  const hero = page.locator("[data-marketplace-hero]")
  await expect(hero.locator("[data-home-map-preview]")).toHaveCount(0)
  await expect(
    page.locator("[data-public-marketplace-home] [data-home-map-preview]")
  ).toHaveCount(0)
  await expect(hero).toHaveScreenshot("public-home-map-hero.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
    maxDiffPixelRatio: 0.02,
  })
})

test("public home keeps the app shell", async ({ page }) => {
  await page.goto("/")
  await page.waitForSelector("[data-marketplace-hero]", { state: "visible" })
  await waitForMarketplaceLiveCount(page)
  await stabilizeForScreenshot(page)

  await expect(page).toHaveScreenshot("public-home-shell.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
    maxDiffPixelRatio: 0.02,
  })
})

test("public home canvas product navigator", async ({ page }) => {
  await page.goto("/home-canvas")
  await page.waitForSelector("[data-public-home-product-navigator]", {
    state: "visible",
  })
  await stabilizeForScreenshot(page)

  const navigator = page.locator("[data-public-home-product-navigator]")
  await expect(navigator.getByRole("button")).toHaveCount(2)
  await expect(navigator.getByRole("link", { name: "Find" })).toHaveAttribute(
    "aria-current",
    "true"
  )
  await expect(
    navigator.getByRole("button", { name: "Build" })
  ).toHaveAttribute("aria-pressed", "false")
  await expect(navigator.getByRole("button", { name: "Fund" })).toHaveAttribute(
    "aria-pressed",
    "false"
  )
})

test("public home mobile hero", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  await page.waitForSelector("[data-marketplace-hero]", { state: "visible" })
  await page.waitForLoadState("networkidle")
  await stabilizeForScreenshot(page)

  const panel = page.locator("[data-marketplace-scroll]")
  const hero = page.locator("[data-marketplace-hero]")
  await expect(page.locator("#marketplace-hero-title")).toContainText(
    "Build and collect NFPs."
  )
  expect(
    await panel.evaluate(
      (element) => element.scrollWidth <= element.clientWidth
    )
  ).toBe(true)
  await expect(hero).toBeVisible()
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  expect(
    await page.evaluate(() => document.body.scrollHeight === innerHeight)
  ).toBe(true)
})

test("public home short mobile hero clears the product navigator", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  await stabilizeForScreenshot(page)

  const panel = page.locator("[data-marketplace-scroll]")
  const collect = page.locator("[data-marketplace-collect]")
  expect(
    await panel.evaluate(
      (element) => element.scrollHeight > element.clientHeight
    )
  ).toBe(true)

  await panel.evaluate((element) =>
    element.scrollTo({ top: element.scrollHeight })
  )
  const panelBottomBox = await panel.boundingBox()
  const collectBottomBox = await collect.boundingBox()
  expect(panelBottomBox).not.toBeNull()
  expect(collectBottomBox).not.toBeNull()
  expect(collectBottomBox!.y + collectBottomBox!.height).toBeLessThanOrEqual(
    panelBottomBox!.y + panelBottomBox!.height + 1
  )
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
})

test("public home landscape hero remains reachable", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")

  const panel = page.locator("[data-marketplace-scroll]")
  await expect(panel).toBeVisible()
  await expect
    .poll(() =>
      panel.evaluate((element) => element.scrollHeight > element.clientHeight)
    )
    .toBe(true)

  await panel.evaluate((element) =>
    element.scrollTo({ top: element.scrollHeight })
  )
  const panelBox = await panel.boundingBox()
  const collectBox = await page
    .locator("[data-marketplace-collect]")
    .boundingBox()
  expect(panelBox).not.toBeNull()
  expect(collectBox).not.toBeNull()
  expect(collectBox!.y + collectBox!.height).toBeLessThanOrEqual(
    panelBox!.y + panelBox!.height + 1
  )
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
})

test("pricing is embedded in Build", async ({ page }) => {
  await page.goto("/?section=platform")
  await page.waitForSelector("[data-public-home-build-pricing]", {
    state: "attached",
  })
  await stabilizeForScreenshot(page)

  const pricing = page.locator("[data-public-home-build-pricing]")
  await pricing.evaluate((element) =>
    element.scrollIntoView({ block: "start" })
  )
  await expect(page).toHaveScreenshot("pricing-embed-shell.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
    maxDiffPixelRatio: 0.018,
  })
})

test("Build workspace preview reflows at 320 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/?section=platform")
  await stabilizeForScreenshot(page)

  const preview = page.locator("[data-public-home-workspace-preview]")
  await preview.scrollIntoViewIfNeeded()
  await expect(preview).toBeVisible()
  expect(
    await preview.evaluate(
      (element) => element.scrollWidth <= element.clientWidth
    )
  ).toBe(true)
  const status = preview.getByText("On track")
  const statusBox = await status.boundingBox()
  const previewBox = await preview.boundingBox()
  expect(statusBox).not.toBeNull()
  expect(previewBox).not.toBeNull()
  expect(statusBox!.x + statusBox!.width).toBeLessThanOrEqual(
    previewBox!.x + previewBox!.width
  )
})

test("Fund reuses the fiscal sponsorship workspace card", async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto("/?section=accelerator", { waitUntil: "domcontentloaded" })
  await page.waitForSelector(
    '[data-fiscal-sponsorship-surface="workspace-card"]',
    { state: "visible" }
  )
  await waitForHomeCanvasHydration(page)
  await stabilizeForScreenshot(page)

  const fiscalCard = page.locator(
    '[data-fiscal-sponsorship-surface="workspace-card"]'
  )
  const startApplication = fiscalCard.getByRole("link", {
    name: "Start application",
  })
  await expect(startApplication).toBeEnabled()
  await startApplication.click()
  await expect(page).toHaveURL(/section=signup&intent=fund/)
})

test("Fund fiscal sponsorship card wraps at 320 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/?section=accelerator")
  const fiscalCard = page.locator(
    '[data-fiscal-sponsorship-surface="workspace-card"]'
  )
  await fiscalCard.waitFor({ state: "visible", timeout: 30_000 })
  await stabilizeForScreenshot(page)

  await expect(fiscalCard.locator('[data-slot="card-title"]')).toHaveText(
    "Fiscal Sponsorship"
  )
  expect(
    await fiscalCard.evaluate(
      (element) => element.scrollWidth <= element.clientWidth
    )
  ).toBe(true)
  await expect(
    fiscalCard.getByText("Application intake", { exact: true })
  ).toBeVisible()
  await expect(
    fiscalCard.getByText("Required documents", { exact: true })
  ).toBeVisible()
  await expect(
    fiscalCard.getByText("Submit grant request", { exact: true })
  ).toBeVisible()
})

test("public Find uses the shared tabs in its permanent drawer", async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.route("**/api/public/resource-map/index?**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        page: {
          hasMore: false,
          limit: 200,
          nextCursor: null,
          totalCount: 1,
        },
        resourceItems: [
          {
            city: "Chicago",
            country: "United States",
            id: "resource_map:visual-food-pantry",
            itemType: "external_resource",
            latitude: 41.881,
            longitude: -87.629,
            primaryResourceCategory: "food",
            resourceCategories: ["food"],
            state: "IL",
            subtitle: "Community food access",
            title: "Visual Test Food Pantry",
            verificationStatus: "external_data",
            visibility: "published",
          },
        ],
        version: 2,
      },
      status: 200,
    })
  })
  await page.goto("/find")

  const drawer = page.getByRole("dialog", { name: "Resource map panel" })
  await expect(drawer).toBeVisible({ timeout: 45_000 })
  const tabList = drawer.locator("[data-public-map-tab-list]")
  await expect(tabList).toBeVisible()
  await expect(tabList.getByRole("tab")).toHaveCount(3)
  await expect(tabList.getByRole("tab", { name: "Find" })).toHaveAttribute(
    "data-state",
    "active"
  )
  await expect(tabList.getByRole("tab", { name: "Guides" })).toBeVisible()
  await expect(tabList.getByRole("tab", { name: "My Map" })).toBeVisible()
  await expect(
    drawer.getByRole("searchbox", {
      name: "Find organizations and resources",
    })
  ).toBeVisible()
  await expect(
    drawer.getByRole("heading", { name: "Find Nearby" })
  ).toBeVisible()
  await expect(drawer.getByLabel("Filter resources by category")).toHaveCount(0)
  const searchInput = drawer.getByRole("searchbox", {
    name: "Find organizations and resources",
  })
  expect(
    await searchInput.evaluate(
      (element) =>
        getComputedStyle(element.closest(".text-card-foreground")!)
          .borderBottomWidth
    )
  ).toBe("0px")
  await searchInput.fill("food")
  await expect(drawer.getByLabel("Filter resources by category")).toBeVisible()
  await expect(drawer.getByRole("button", { name: "Cancel" })).toBeVisible()
  const resultTriggers = drawer.locator(
    '[data-public-map-result-trigger="true"]'
  )
  await expect(resultTriggers.first()).toBeVisible()
  await expect(
    drawer.locator('[data-public-map-organization-list-section="card-grid"]')
  ).toHaveClass(/divide-y/)

  await searchInput.press("ArrowDown")
  await expect(page.locator(":focus")).toHaveAttribute(
    "data-public-map-result-trigger",
    "true"
  )
  const firstFocusedLabel = await page
    .locator(":focus")
    .getAttribute("aria-label")
  await page.keyboard.press("ArrowDown")
  await expect(page.locator(":focus")).not.toHaveAttribute(
    "aria-label",
    firstFocusedLabel ?? ""
  )
  await page.keyboard.press("Escape")
  await expect(searchInput).toBeFocused()
  await searchInput.press("Escape")
  await expect(searchInput).toHaveValue("")
  await searchInput.press("Escape")
  await expect(
    drawer.getByRole("heading", { name: "Find Nearby" })
  ).toBeVisible()
})

test("public Find resizes its mobile drawer through the accessible handle", async ({
  page,
}) => {
  test.setTimeout(60_000)
  const consoleErrors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/find")

  const drawer = page.locator('[data-slot="drawer-content"]')
  await expect(drawer).toBeVisible({ timeout: 30_000 })
  const tabList = drawer.locator("[data-public-map-tab-list]")
  await expect(tabList.getByRole("tab")).toHaveCount(3)
  await expect(tabList.getByRole("tab", { name: "Find" })).toBeVisible()
  await expect(tabList.getByRole("tab", { name: "Guides" })).toBeVisible()
  await expect(tabList.getByRole("tab", { name: "My Map" })).toBeVisible()
  await expect(
    drawer.getByRole("searchbox", {
      name: "Find organizations and resources",
    })
  ).toBeVisible()
  const resizeControl = drawer.getByRole("button", {
    name: "Resize resource map panel to full height",
  })
  await expect(resizeControl).toBeVisible()
  const resizeControlHeight = await resizeControl.evaluate((element) =>
    Math.round(element.getBoundingClientRect().height)
  )
  const restingBackground = await resizeControl.evaluate(
    (element) => getComputedStyle(element).backgroundColor
  )
  expect(resizeControlHeight).toBe(23)
  await resizeControl.hover()
  await expect
    .poll(() =>
      resizeControl.evaluate(
        (element) => getComputedStyle(element).backgroundColor
      )
    )
    .toBe(restingBackground)
  await resizeControl.click()
  const returnToMiddleControl = drawer.getByRole("button", {
    name: "Resize resource map panel to middle height",
  })
  await expect(returnToMiddleControl).toBeVisible()
  await returnToMiddleControl.click()
  await expect(resizeControl).toBeVisible()
  await expect(
    page.locator('header button[aria-label="Open Find, Guides, and Saved"]')
  ).toHaveCount(0)
  expect(consoleErrors).toEqual([])
})

for (const width of [768, 1024]) {
  test(`public Find keeps one directory drawer at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width, height: 800 })
    await page.goto("/find")

    await expect(page.locator("[data-public-map-tab-list]")).toBeVisible()
    await expect(page.locator('[data-slot="drawer-content"]')).toHaveCount(1)
    await expect(
      page.locator('[data-public-map-tabbed-rail-placement="home-canvas"]')
    ).toHaveCount(0)
  })
}
