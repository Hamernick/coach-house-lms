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

test("map-first public home", async ({ page }) => {
  await page.goto("/")
  await page.waitForSelector("[data-public-home-hero]", { state: "visible" })
  await stabilizeForScreenshot(page)

  const hero = page.locator("[data-public-home-hero]")
  await expect(page.locator("[data-home-map-preview]")).toHaveAttribute(
    "data-home-map-controls-position",
    "top-left"
  )
  await expect(hero).toHaveScreenshot("public-home-map-hero.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
    maxDiffPixelRatio: 0.02,
  })
})

test("public home keeps the app shell", async ({ page }) => {
  await page.goto("/")
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
  await page.goto("/")
  await page.waitForSelector("[data-public-home-product-navigator]", {
    state: "visible",
  })
  await stabilizeForScreenshot(page)

  const navigator = page.locator("[data-public-home-product-navigator]")
  await expect(navigator).toHaveScreenshot(
    "public-home-product-navigator.png",
    {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      maxDiffPixelRatio: 0.01,
    }
  )
})

test("public home mobile hero", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  await page.waitForSelector("[data-public-home-hero]", { state: "visible" })
  await page.waitForLoadState("networkidle")
  await stabilizeForScreenshot(page)

  await expect(page).toHaveScreenshot("public-home-mobile-hero.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
    maxDiffPixelRatio: 0.02,
  })
})

test("public home short mobile hero clears the product navigator", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
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

  await expect(page).toHaveScreenshot("public-home-short-mobile-hero.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
    maxDiffPixelRatio: 0.02,
  })

  await panel.evaluate((element) => element.scrollTo({ top: element.scrollHeight }))
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
  await page.goto("/")

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

  await expect(preview).toHaveScreenshot(
    "public-home-mobile-workspace-preview.png",
    {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      maxDiffPixelRatio: 0.015,
    }
  )
})

test("Fund reuses the fiscal sponsorship workspace card", async ({ page }) => {
  await page.goto("/?section=accelerator")
  await page.waitForSelector(
    '[data-fiscal-sponsorship-surface="workspace-card"]',
    { state: "visible" }
  )
  await stabilizeForScreenshot(page)

  const fiscalCard = page.locator(
    '[data-fiscal-sponsorship-surface="workspace-card"]'
  )
  await expect(fiscalCard).toHaveScreenshot(
    "public-home-fiscal-sponsorship-card.png",
    {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      maxDiffPixelRatio: 0.018,
    }
  )

  const startApplication = fiscalCard.getByRole("button", {
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

  await page.addStyleTag({
    content: "[data-public-home-product-navigator] { display: none !important; }",
  })
  await page.setViewportSize({ width: 320, height: 1100 })
  await fiscalCard.scrollIntoViewIfNeeded()

  await expect(fiscalCard).toHaveScreenshot(
    "public-home-mobile-fiscal-sponsorship-card.png",
    {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      maxDiffPixelRatio: 0.015,
    }
  )
})

test("public Find uses the shared tab rail", async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto("/find")

  const tabList = page.locator("[data-public-map-tab-list]").first()
  await expect(tabList).toBeVisible()
  await expect(tabList.getByRole("tab")).toHaveCount(3)
  await expect(tabList.getByRole("tab", { name: "Find" })).toHaveAttribute(
    "data-state",
    "active"
  )
  await expect(tabList.getByRole("tab", { name: "Guides" })).toBeVisible()
  await expect(tabList.getByRole("tab", { name: "Saved" })).toBeVisible()
  await stabilizeForScreenshot(page)

  await expect(tabList).toHaveScreenshot("public-find-tab-list.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
    maxDiffPixelRatio: 0.01,
  })
})

test("public Find exposes the shared tab rail in the mobile details sheet", async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto("/find")

  const header = page.locator("header")
  const trigger = page.locator(
    'header button[aria-label="Open Find, Guides, and Saved"]'
  )
  await expect(trigger).toBeVisible({ timeout: 30_000 })
  const triggerBox = await trigger.boundingBox()
  expect(triggerBox).not.toBeNull()
  expect(triggerBox!.width).toBeGreaterThanOrEqual(40)
  expect(triggerBox!.height).toBeGreaterThanOrEqual(40)
  expect(
    await header.evaluate(
      (element) => element.scrollWidth <= element.clientWidth
    )
  ).toBe(true)
  await expect(page.locator('[data-slot="drawer-content"]')).toHaveCount(1)

  await trigger.click()
  const sheet = page.locator('[data-sidebar="sidebar"][data-mobile="true"]')
  await expect(sheet).toBeVisible()
  const tabList = sheet.locator("[data-public-map-tab-list]")
  await expect(tabList.getByRole("tab")).toHaveCount(3)
  await expect(tabList.getByRole("tab", { name: "Find" })).toBeVisible()
  await expect(tabList.getByRole("tab", { name: "Guides" })).toBeVisible()
  await expect(tabList.getByRole("tab", { name: "Saved" })).toBeVisible()
  expect(
    await sheet.evaluate(
      (element) => element.scrollWidth <= element.clientWidth
    )
  ).toBe(true)
  await stabilizeForScreenshot(page)

  await expect(sheet).toHaveScreenshot("public-find-mobile-tab-sheet.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
    maxDiffPixelRatio: 0.015,
  })
})

for (const width of [768, 1024]) {
  test(`public Find avoids a duplicate directory drawer at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width, height: 800 })
    await page.goto("/find")

    await expect(page.locator("[data-public-map-tab-list]")).toBeVisible()
    await expect(page.locator('[data-slot="drawer-content"]')).toHaveCount(0)
    await expect(
      page.locator('[data-public-map-tabbed-rail-placement="home-canvas"]')
    ).toHaveCount(1)
  })
}
