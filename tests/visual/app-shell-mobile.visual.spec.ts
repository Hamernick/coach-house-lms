import { expect, test, type Page } from "@playwright/test"

const pageErrors = new WeakMap<Page, string[]>()

test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page)).toEqual([])
})

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|hydrating/i.test(message.text())
    )
      errors.push(message.text())
  })
  await page.route("https://unpkg.com/react-grab@*/**", (route) =>
    route.fulfill({ body: "", contentType: "application/javascript" })
  )
  pageErrors.set(page, errors)
})

const fixture = "/visual-regression/app-shell"

test("mobile shell keeps navigation reachable above the final action", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(fixture)
  const navigation = page.getByRole("navigation", { name: "Main navigation" })
  await expect(navigation).toBeVisible()
  await expect(navigation.getByRole("link", { name: "Find" })).toHaveAttribute(
    "href",
    "/"
  )
  expect(
    await navigation.getByRole("link", { name: "Workspace" }).count()
  ).toBe(0)

  const menu = page.getByRole("button", { name: "Menu" })
  const menuSize = await menu.boundingBox()
  expect(menuSize).not.toBeNull()
  expect(menuSize!.width).toBeGreaterThanOrEqual(44)
  expect(menuSize!.height).toBeGreaterThanOrEqual(44)
  await menu.click()
  const sidebar = page.getByRole("dialog", { name: "Sidebar" })
  await expect(sidebar).toBeVisible()
  for (const control of await sidebar.locator("a[href],button").all()) {
    if (!(await control.isVisible())) continue
    const bounds = await control.boundingBox()
    expect(bounds!.width).toBeGreaterThanOrEqual(44)
    expect(bounds!.height).toBeGreaterThanOrEqual(44)
  }
  await expect(sidebar.getByRole("button", { name: /Theme/ })).toBeVisible()
  await sidebar.getByRole("button", { name: "Close menu" }).click()
  await expect(sidebar).toBeHidden()
  await expect(menu).toBeFocused()

  await menu.click()
  // Keep the route mounted to prove link activation closes the sidebar itself.
  const destination = sidebar.getByRole("link", {
    name: "Documentation",
    exact: true,
  })
  await destination.evaluate((element) =>
    element.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    })
  )
  await destination.press("Enter")
  await expect(sidebar).toBeHidden()
  await expect(menu).toBeFocused()
  await menu.press("Space")
  await expect(sidebar).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(sidebar).toBeHidden()
  await expect(menu).toBeFocused()

  await page.locator("[data-shell-scroll]").evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  const lastAction = await page
    .getByRole("button", { name: "Last workspace action" })
    .boundingBox()
  const dock = await navigation.boundingBox()
  expect(lastAction).not.toBeNull()
  expect(dock).not.toBeNull()
  expect(lastAction!.y + lastAction!.height).toBeLessThanOrEqual(dock!.y)
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  ).toBe(false)
})

test("mobile Details closes with Escape and returns focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto(fixture)
  const details = page.getByRole("button", { name: "Details" })
  await expect(details).toBeVisible()
  await details.click()
  const drawer = page.getByRole("dialog", { name: "Details" })
  await expect(drawer).toBeVisible()
  await expect(
    drawer.getByRole("textbox", { name: "Project name" })
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(drawer).toBeHidden()
  await expect(details).toBeFocused()
  await details.press("Enter")
  await expect(drawer).toBeVisible()
  await drawer.getByRole("button", { name: "Close", exact: true }).click()
  await expect(drawer).toBeHidden()
  await expect(details).toBeFocused()
})

test("Workspace dock link follows the existing access input", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${fixture}?scenario=workspace-navigation&rail=none`)
  const navigation = page.getByRole("navigation", { name: "Main navigation" })
  await expect(
    navigation.getByRole("link", { name: "Workspace" })
  ).toHaveAttribute("href", "/workspace")
  await page.goto(`${fixture}?scenario=restricted-navigation&rail=none`)
  await expect(
    page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", {
        name: "Workspace",
      })
  ).toHaveCount(0)
})

test("locked navigation has no destinations and absent rails have no Details", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${fixture}?scenario=locked-navigation&rail=none`)
  await expect(
    page.getByRole("heading", { name: "Navigation visibility fixture" })
  ).toBeVisible()
  await expect(
    page.getByRole("navigation", { name: "Main navigation" })
  ).toHaveCount(0)
  await page.goto(`${fixture}?rail=none`)
  await expect(
    page.getByRole("navigation", { name: "Main navigation" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Details", exact: true })
  ).toHaveCount(0)
})

test("full-bleed content clears the dock and desktop keeps its rail", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${fixture}?mode=full-bleed`)
  const navigation = page.getByRole("navigation", { name: "Main navigation" })
  await expect(navigation).toBeVisible()
  await page.locator("[data-shell-content-body] > div").evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  const lastAction = await page
    .getByRole("button", { name: "Last workspace action" })
    .boundingBox()
  const dock = await navigation.boundingBox()
  expect(lastAction).not.toBeNull()
  expect(dock).not.toBeNull()
  expect(lastAction!.y + lastAction!.height).toBeLessThanOrEqual(dock!.y)

  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(navigation).toBeHidden()
  await expect(
    page.getByRole("button", { name: "Toggle sidebar" })
  ).toBeVisible()
  await page.getByRole("button", { name: "Toggle details panel" }).click()
  await expect(page.locator("#app-shell-right-rail")).toHaveAttribute(
    "data-state",
    "open"
  )
})

test("keyboard clearance and reduced motion preserve mobile actions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto(fixture)
  const navigation = page.getByRole("navigation", { name: "Main navigation" })
  await expect(navigation).toBeVisible()
  await page.getByRole("textbox", { name: "Search workspace" }).focus()
  await page.evaluate(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    Object.defineProperty(viewport, "height", {
      configurable: true,
      value: window.innerHeight - 250,
    })
    viewport.dispatchEvent(new Event("resize"))
  })
  await expect(navigation).toBeHidden()
  await page.evaluate(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    Reflect.deleteProperty(viewport, "height")
    viewport.dispatchEvent(new Event("resize"))
  })
  await expect(navigation).toBeVisible()
  expect(
    await navigation
      .locator("span[aria-hidden]")
      .evaluate((element) => getComputedStyle(element).transitionDuration)
  ).toBe("0s")
})

const visualCases = [
  { width: 320, height: 740, theme: "light" },
  { width: 390, height: 844, theme: "light" },
  { width: 390, height: 844, theme: "dark" },
  { width: 768, height: 1024, theme: "light" },
  { width: 1440, height: 900, theme: "light" },
  { width: 1440, height: 900, theme: "dark" },
] as const

for (const { width, height, theme } of visualCases) {
  test(`baseline ${width} ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ colorScheme: theme })
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme
    )
    await page.goto(fixture)
    await expect(
      page.getByRole("heading", { name: "Your workspace" })
    ).toBeVisible()
    if (width < 768) {
      await expect(
        page.getByRole("navigation", { name: "Main navigation" })
      ).toBeVisible()
    } else {
      await expect(
        page.getByRole("button", { name: "Toggle sidebar" })
      ).toBeVisible()
    }
    await page.addStyleTag({
      content:
        "nextjs-portal, [data-testid='react-grab-overlay'] { visibility: hidden !important; }",
    })
    await expect(page).toHaveScreenshot(`app-shell-${width}-${theme}.png`, {
      animations: "disabled",
    })
  })
}
