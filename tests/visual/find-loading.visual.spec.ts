import { expect, test, type Page } from "@playwright/test"
import { mobileScreenshotName } from "./mobile-screenshot-name"

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

for (const width of [320, 390]) {
  test(`mobile map fills its viewport before hydration and keeps its menu above controls at ${width}px`, async ({
    browser,
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 })
    const initialContext = await browser.newContext({
      viewport: { width, height: 844 },
      extraHTTPHeaders: { "x-coach-house-visual-regression": "1" },
    })
    await initialContext.route("**/_next/static/**/*.js", (route) =>
      route.abort()
    )
    const initialPage = await initialContext.newPage()
    const target = "/visual-regression/find-loading?shell=app&react-grab=0"
    await page.goto(target)
    // The fixture supplies a display user, not an authenticated session.
    // Exclude development controls and transient auth toasts from layout captures.
    await page.addStyleTag({ content: "nextjs-portal, [data-sonner-toaster] { display: none !important; }" })
    await initialPage.goto(new URL(target, page.url()).href)
    await expect(initialPage.locator("[data-mobile-map-fixture]")).toBeVisible()
    const initialFrame = await initialPage
      .locator("[data-mobile-map-fixture]")
      .boundingBox()
    const loadedFrame = await page
      .locator("[data-mobile-map-fixture]")
      .boundingBox()
    expect(initialFrame).toEqual(loadedFrame)
    expect(loadedFrame?.x).toBe(0)
    expect(loadedFrame?.width).toBe(width)
    expect(loadedFrame?.y).toBe(0)
    expect(loadedFrame?.height).toBe(844)
    await expect(page.locator("header").filter({ has: page.locator("#site-header-title") })).toBeHidden()
    const dock = page.getByRole("navigation", { name: "Main navigation" })
    await expect.poll(async () => Math.abs(
      await dock.evaluate(e => e.getBoundingClientRect().bottom) - await page.locator("[data-public-map-combined-panel]").evaluate(e => e.getBoundingClientRect().bottom)
    )).toBeLessThan(2)
    const initialDockBox = await dock.boundingBox()
    await expect(dock.getByRole("button")).toHaveText(["Menu", "Notifications", "Search", "Profile"])
    await expect(dock.getByRole("link")).toHaveCount(0)
    await expect(dock.getByRole("img", { name: "Mobile Demo" })).toBeVisible()
    for (const control of await dock.getByRole("button").all()) {
      const box = await control.boundingBox()
      expect(box?.width).toBeGreaterThanOrEqual(44)
      expect(box?.height).toBeGreaterThanOrEqual(44)
    }
    await initialContext.close()

    await expect(
      page.getByRole("dialog", { name: "Resource map panel" })
    ).toBeVisible()
    const welcome = page.getByRole("button", { name: "Welcome", exact: true })
    const location = page.getByRole("button", {
      name: "Use my location",
      exact: true,
    })
    const welcomeBox = await welcome.boundingBox()
    const locationBox = await location.boundingBox()
    expect((welcomeBox?.y ?? 0) + (welcomeBox?.height ?? 0) / 2).toBe(
      (locationBox?.y ?? 0) + (locationBox?.height ?? 0) / 2
    )
    expect(welcomeBox?.height).toBe(locationBox?.height)
    expect(locationBox?.height).toBeGreaterThanOrEqual(32)
    expect(locationBox?.height).toBeLessThanOrEqual(36)
    const weather = page.getByRole("status", { name: "Current observed temperature: -12 degrees." })
    const weatherBox = await weather.boundingBox()
    expect(weatherBox?.height).toBe(locationBox?.height)
    expect((welcomeBox?.x ?? 0) + (welcomeBox?.width ?? 0)).toBeLessThanOrEqual(weatherBox?.x ?? 0)
    expect(await weather.locator("span").evaluate(e => parseFloat(getComputedStyle(e).fontSize))).toBeLessThanOrEqual(14)
    const statusBox = await page
      .locator('[aria-label="Resources directory status: active, 123,456"]')
      .boundingBox()
    expect(statusBox?.height).toBe(locationBox?.height)
    expect((statusBox?.x ?? 0) - ((locationBox?.x ?? 0) + (locationBox?.width ?? 0))).toBe(4)
    expect(await page.locator("[data-public-map-directory-status]").evaluate(e => ({ shrink: getComputedStyle(e).flexShrink, overflow: e.scrollWidth > e.clientWidth }))).toEqual({ shrink: "0", overflow: false })
    await expect(page.locator("[data-public-map-active-label]")).toBeVisible()
    const activeSpacing = await page.locator("[data-public-map-directory-status]").evaluate(e => {
      const style = getComputedStyle(e)
      return { gap: parseFloat(style.columnGap), padding: parseFloat(style.paddingLeft) }
    })
    expect(activeSpacing.gap).toBe(8)
    expect(activeSpacing.padding).toBe(10)
    expect(await page.locator("[data-public-map-directory-status]").evaluate(e => {
      const centers = Array.from(e.children).map(child => {
        const rect = child.getBoundingClientRect()
        return rect.top + rect.height / 2
      })
      return Math.max(...centers) - Math.min(...centers)
    })).toBeLessThanOrEqual(1)
    expect((statusBox?.x ?? 0) + (statusBox?.width ?? 0)).toBeLessThanOrEqual(
      welcomeBox?.x ?? 0
    )
    expect((locationBox?.x ?? 0) + (locationBox?.width ?? 0)).toBeLessThanOrEqual(statusBox?.x ?? 0)
    expect(await location.evaluate(e => {
      const after = getComputedStyle(e, "::after")
      return e.getBoundingClientRect().height - parseFloat(after.top) - parseFloat(after.bottom)
    })).toBeGreaterThanOrEqual(44)
    const welcomeHalfWidth = (welcomeBox?.width ?? 0) / 2
    const centeredWelcomePosition = Math.max(
      width / 2,
      (statusBox?.x ?? 0) + (statusBox?.width ?? 0) + 4 + welcomeHalfWidth
    )
    expect((welcomeBox?.x ?? 0) + welcomeHalfWidth).toBeCloseTo(centeredWelcomePosition, 1)
    await page.screenshot({ path: `/tmp/coach-house-mobile-map-${width}.png` })
    await expect(page).toHaveScreenshot(`find-map-navigation-${width}.png`, { animations: "disabled", maxDiffPixelRatio: 0.02 })
    await page.emulateMedia({ colorScheme: "dark" })
    await expect(page.locator("html")).toHaveClass(/dark/)
    await expect(page).toHaveScreenshot(`find-map-navigation-${width}-dark.png`, { animations: "disabled", maxDiffPixelRatio: 0.02 })
    await page.emulateMedia({ colorScheme: "light" })
    await expect(page.locator("html")).not.toHaveClass(/dark/)
    await location.click()
    await expect(
      page.getByText("Use your location?", { exact: true })
    ).toBeVisible()
    await page.getByRole("button", { name: "Not now", exact: true }).click()

    const grip = (await page.getByRole("button", { name: "Resize resource map panel to middle height" }).boundingBox())!
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2)
    await page.mouse.down()
    await page.mouse.move(grip.x + grip.width / 2, grip.y - 280, { steps: 12 })
    expect(Math.abs((await dock.boundingBox())!.y - initialDockBox!.y)).toBeLessThan(2)
    await page.mouse.up()
    await expect(page.locator('[data-public-map-drawer-snap-index="1"]')).toBeVisible()
    await page.getByRole("button", { name: "Resize resource map panel to full height" }).press("ArrowDown")
    await expect(page.locator('[data-public-map-drawer-snap-index="0"]')).toBeVisible()

    await page.getByRole("button", { name: "Menu", exact: true }).click()
    const sidebar = page.getByRole("dialog", { name: "Sidebar", exact: true })
    await expect(sidebar).toBeVisible()
    await sidebar.getByRole("button", { name: "Show calendar", exact: true }).click()
    const calendar = page.getByRole("dialog", { name: "Workspace calendar", exact: true })
    await expect(calendar).toBeVisible()
    await calendar.getByRole("button", { name: "Close calendar", exact: true }).click()
    await expect(calendar).toBeHidden()
    await expect(sidebar).toBeVisible()
    await expect
      .poll(() =>
        page.evaluate(() => {
          const controls = document.querySelector(
            "[data-public-map-location-controls]"
          )!
          const rect = controls.getBoundingClientRect()
          return Boolean(
            document
              .elementFromPoint(rect.x + 20, rect.y + 20)
              ?.closest('[data-mobile="true"]')
          )
        })
      )
      .toBe(true)
    await sidebar.getByRole("button", { name: "Close", exact: true }).click()
    await dock.getByRole("button", { name: "Notifications", exact: true }).click()
    const notifications = page.getByRole("dialog", { name: "Notifications", exact: true })
    await expect(notifications).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(notifications).toBeHidden()
    await dock.getByRole("button", { name: "Search", exact: true }).click()
    await expect(page.getByRole("searchbox", { name: "Find resources" })).toBeVisible()
    await expect(page.locator('[data-public-map-drawer-snap-index="1"]')).toBeVisible()
    await expect.poll(async () => Math.abs((await dock.boundingBox())!.y - initialDockBox!.y)).toBeLessThan(1)
    expect(await dock.evaluate(e => Boolean(e.closest("[data-public-map-combined-panel]")))).toBe(true)
    await page.evaluate(() => document.fonts.ready)
    const resourceList = page.locator("[data-fixture-resource-list]")
    await resourceList.evaluate(e => { e.scrollTop = e.scrollHeight })
    await expect.poll(() => resourceList.evaluate(e => Math.abs(e.scrollHeight - e.clientHeight - e.scrollTop))).toBeLessThan(1)
    await expect(dock.getByRole("button", { name: "Profile", exact: true })).toBeVisible()
    await expect(page).toHaveScreenshot(mobileScreenshotName(`find-map-panel-expanded-${width}.png`), { animations: "disabled", maxDiffPixelRatio: 0.005 })
    await page.getByRole("button", { name: "Resize resource map panel to full height" }).press("ArrowDown")
    await expect(page.getByRole("searchbox", { name: "Find resources" })).toBeHidden()
    await expect.poll(async () => Math.abs((await dock.boundingBox())!.y - initialDockBox!.y)).toBeLessThan(1)
    await dock.getByRole("button", { name: "Profile", exact: true }).click()
    await expect(page.getByRole("menu")).toBeVisible()
    await expect(page.getByRole("button", { name: "Public profile", exact: true })).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("menu")).toBeHidden()
    await page
      .getByRole("button", {
        name: "Resize resource map panel to middle height",
      })
      .click()
    await page
      .getByRole("button", { name: "Resize resource map panel to full height" })
      .click()
    await expect(
      page.locator('[data-public-map-drawer-snap-index="2"]')
    ).toBeVisible()
    await expect(welcome).toBeHidden()
    await expect(location).toBeHidden()
    await expect
      .poll(() =>
        page.evaluate(() => {
          const rect = document
            .querySelector("[data-public-map-location-controls]")!
            .getBoundingClientRect()
          return Boolean(
            document
              .elementFromPoint(rect.x + 20, rect.y + 20)
              ?.closest("[data-public-map-drawer-mode]")
          )
        })
      )
      .toBe(true)
    await page
      .getByRole("button", {
        name: "Resize resource map panel to collapsed height",
      })
      .click()
    await welcome.click()
    await expect(
      page.locator("[data-public-map-welcome-control] > button")
    ).toHaveAttribute("aria-pressed", "true")
    const onboarding = page.getByRole("dialog", { name: "Welcome to Find", exact: true })
    await expect(onboarding).toBeVisible()
    const onboardingBox = await onboarding.boundingBox()
    expect(onboardingBox?.width).toBeLessThanOrEqual(320)
    expect(onboardingBox?.height).toBeLessThanOrEqual(448)
    expect((onboardingBox?.x ?? 0) + (onboardingBox?.width ?? 0) / 2).toBeCloseTo(width / 2, 1)
    expect((onboardingBox?.y ?? 0) + (onboardingBox?.height ?? 0) / 2).toBeCloseTo(844 / 2, 1)
    expect(await onboarding.evaluate(e => e.closest("[data-mobile-map-fixture]"))).toBeNull()
    await page.setViewportSize({ width, height: 568 })
    await expect.poll(async () => {
      const box = await onboarding.boundingBox()
      return (box?.y ?? 0) + (box?.height ?? 0) / 2
    }).toBeCloseTo(568 / 2, 1)
    const backdrop = page.locator('[data-slot="dialog-overlay"]')
    await expect(backdrop).toBeVisible()
    expect(await backdrop.evaluate(e => getComputedStyle(e).backdropFilter)).toContain("blur(")
    const navigation = page.locator('nav[aria-label="Main navigation"]')
    await expect(navigation).toBeVisible()
    expect(await onboarding.evaluate(e => {
      const nav = document.querySelector('nav[aria-label="Main navigation"]')!
      const a = e.getBoundingClientRect()
      const b = nav.getBoundingClientRect()
      const x = (Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2
      const y = (Math.max(a.top, b.top) + Math.min(a.bottom, b.bottom)) / 2
      return Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top) &&
        e.contains(document.elementFromPoint(x, y))
    })).toBe(true)
    await onboarding.getByRole("button", { name: "Continue", exact: true }).click()
    await expect(page.getByRole("dialog", { name: "Search the directory", exact: true })).toBeVisible()
    await page.getByRole("dialog", { name: "Search the directory", exact: true })
      .getByRole("button", { name: "Skip", exact: true }).click()
    await expect(onboarding).toBeHidden()
    await expect(welcome).toHaveAttribute("aria-pressed", "false")
    await expect(welcome).toBeFocused()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBe(width)
  })
}
