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
      [data-home-canvas-reveal] {
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

test("map-first public home", async ({ page }) => {
  await page.goto("/home-canvas")
  await page.waitForSelector("[data-public-home-hero]", { state: "visible" })
  await stabilizeForScreenshot(page)

  const hero = page.locator("[data-public-home-hero]")
  await expect(page.locator("[data-home-map-preview]")).toHaveAttribute(
    "data-home-map-controls-position",
    "bottom-right"
  )
  await expect(hero).toHaveScreenshot("public-home-map-hero.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
    maxDiffPixelRatio: 0.02,
  })
})

test("public home keeps the app shell", async ({ page }) => {
  await page.goto("/home-canvas")
  await page.waitForSelector("[data-public-home-hero]", { state: "visible" })
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
  await page.goto("/home-canvas")
  await page.waitForSelector("[data-public-home-hero]", { state: "visible" })
  await page.waitForLoadState("networkidle")
  await stabilizeForScreenshot(page)

  const panel = page.locator('[data-home-canvas-panel="hero"]')
  const navigator = page.locator("[data-public-home-product-navigator]")
  const copy = page.locator("[data-home-canvas-hero-copy]")
  const navigatorBox = await navigator.boundingBox()
  const copyBox = await copy.boundingBox()
  expect(navigatorBox).not.toBeNull()
  expect(copyBox).not.toBeNull()
  expect(copyBox!.y).toBeGreaterThanOrEqual(
    navigatorBox!.y + navigatorBox!.height
  )
  expect(
    await panel.evaluate(
      (element) => element.scrollWidth <= element.clientWidth
    )
  ).toBe(true)
})

test("public home short mobile hero clears the product navigator", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/home-canvas")
  await stabilizeForScreenshot(page)

  const panel = page.locator('[data-home-canvas-panel="hero"]')
  const navigator = page.locator("[data-public-home-product-navigator]")
  const copy = page.locator("[data-home-canvas-hero-copy]")
  const navigatorBox = await navigator.boundingBox()
  const copyBox = await copy.boundingBox()
  expect(navigatorBox).not.toBeNull()
  expect(copyBox).not.toBeNull()
  expect(copyBox!.y).toBeGreaterThanOrEqual(
    navigatorBox!.y + navigatorBox!.height
  )
  expect(
    await panel.evaluate(
      (element) => element.scrollHeight > element.clientHeight
    )
  ).toBe(true)

  await panel.evaluate((element) =>
    element.scrollTo({ top: element.scrollHeight })
  )
  const panelBottomBox = await panel.boundingBox()
  const copyBottomBox = await copy.boundingBox()
  expect(panelBottomBox).not.toBeNull()
  expect(copyBottomBox).not.toBeNull()
  expect(copyBottomBox!.y + copyBottomBox!.height).toBeLessThanOrEqual(
    panelBottomBox!.y + panelBottomBox!.height + 1
  )
})

test("public home landscape hero remains reachable", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/home-canvas")

  const panel = page.locator('[data-home-canvas-panel="hero"]')
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
  const copyBox = await page
    .locator("[data-home-canvas-hero-copy]")
    .boundingBox()
  expect(panelBox).not.toBeNull()
  expect(copyBox).not.toBeNull()
  expect(copyBox!.y + copyBox!.height).toBeLessThanOrEqual(
    panelBox!.y + panelBox!.height + 1
  )
})

test("pricing is embedded in Build", async ({ page }) => {
  await page.goto("/home-canvas?section=platform")
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
  await page.goto("/home-canvas?section=platform")
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
  await page.goto("/home-canvas?section=accelerator", {
    waitUntil: "domcontentloaded",
  })
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
  await page.goto("/home-canvas?section=accelerator")
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
  await page.goto("/")

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
  await page.goto("/")

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
  await expect(drawer).toHaveAttribute("data-public-map-drawer-snap-index", "0")
  const resizeToMiddleControl = drawer.getByRole("button", {
    name: "Resize resource map panel to middle height",
  })
  await expect(resizeToMiddleControl).toBeVisible()
  const resizeControlHeight = await resizeToMiddleControl.evaluate((element) =>
    Math.round(element.getBoundingClientRect().height)
  )
  const restingBackground = await resizeToMiddleControl.evaluate(
    (element) => getComputedStyle(element).backgroundColor
  )
  expect(resizeControlHeight).toBe(23)
  await resizeToMiddleControl.hover()
  await expect
    .poll(() =>
      resizeToMiddleControl.evaluate(
        (element) => getComputedStyle(element).backgroundColor
      )
    )
    .toBe(restingBackground)
  await resizeToMiddleControl.click()
  await expect(drawer).toHaveAttribute("data-public-map-drawer-snap-index", "1")
  const resizeToFullControl = drawer.getByRole("button", {
    name: "Resize resource map panel to full height",
  })
  await expect(resizeToFullControl).toBeVisible()
  await resizeToFullControl.click()
  await expect(drawer).toHaveAttribute("data-public-map-drawer-snap-index", "2")
  const returnToMiddleControl = drawer.getByRole("button", {
    name: "Resize resource map panel to middle height",
  })
  await expect(returnToMiddleControl).toBeVisible()
  await returnToMiddleControl.click()
  await expect(drawer).toHaveAttribute("data-public-map-drawer-snap-index", "1")
  await expect(resizeToFullControl).toBeVisible()
  await expect(
    page.locator('header button[aria-label="Open Find, Guides, and Saved"]')
  ).toHaveCount(0)
  expect(consoleErrors).toEqual([])
})

test("public Find keeps balanced desktop frame gutters", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")

  const contentFrame = page.locator("[data-public-find-content-frame]").last()
  await expect(contentFrame).toBeVisible()
  const gutters = await contentFrame.evaluate((element) => {
    const style = window.getComputedStyle(element)
    const frame = element.firstElementChild?.getBoundingClientRect()

    return {
      frameLeft: frame?.left ?? null,
      frameRight: frame ? window.innerWidth - frame.right : null,
      paddingLeft: Number.parseFloat(style.paddingLeft),
      paddingRight: Number.parseFloat(style.paddingRight),
    }
  })

  expect(gutters.paddingLeft).toBeGreaterThan(0)
  expect(gutters.paddingLeft).toBe(gutters.paddingRight)
  expect(gutters.frameLeft).toBe(gutters.frameRight)
})

for (const width of [768, 1024]) {
  test(`public Find keeps one directory drawer at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width, height: 800 })
    await page.goto("/")

    await expect(page.locator("[data-public-map-tab-list]")).toBeVisible()
    await expect(page.locator('[data-slot="drawer-content"]')).toHaveCount(1)
    await expect(
      page.locator('[data-public-map-tabbed-rail-placement="home-canvas"]')
    ).toHaveCount(0)
  })
}
