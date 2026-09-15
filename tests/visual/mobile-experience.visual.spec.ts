import { expect, test } from "@playwright/test"
import { mobileScreenshotName } from "./mobile-screenshot-name"

const route = "/visual-regression/mobile-experience?react-grab=0"

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(route)
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
  await expect(
    page.getByRole("navigation", { name: "Main navigation" })
  ).toBeVisible()
})

for (const width of [320, 390]) {
  for (const theme of ["light", "dark"] as const) {
    test(`mobile navigation ${width} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
      const nav = page.getByRole("navigation", { name: "Main navigation" })
      await expect(
        nav.getByRole("link", { name: "Workspace" })
      ).toHaveAttribute("aria-current", "page")
      for (const target of await nav.locator("a,button").all()) {
        const box = await target.boundingBox()
        expect(box?.width).toBeGreaterThanOrEqual(44)
        expect(box?.height).toBeGreaterThanOrEqual(44)
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      await expect(page).toHaveScreenshot(
        mobileScreenshotName(`mobile-navigation-${width}-${theme}.png`),
        { animations: "disabled", scale: "css" }
      )
    })
  }
}

test("tap navigation, browser back, menu dismissal and focus return", async ({
  page,
}) => {
  const nav = page.getByRole("navigation", { name: "Main navigation" })
  await nav.getByRole("link", { name: "Find" }).click()
  await expect(page).toHaveURL(/section=find/)
  await expect(nav.getByRole("link", { name: "Find" })).toHaveAttribute(
    "aria-current",
    "page"
  )
  await page.goBack()
  await expect(nav.getByRole("link", { name: "Workspace" })).toHaveAttribute(
    "aria-current",
    "page"
  )
  await expect(nav.getByRole("button", { name: "Menu" })).toHaveCount(0)
  await expect(nav.getByRole("link", { name: "Coaching" })).toHaveCount(0)
  await page.getByRole("button", { name: "Menu", exact: true }).click()
  await expect(
    page.getByRole("dialog", { name: "Workspace menu" })
  ).toBeVisible()
  await page.getByRole("button", { name: "Close", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await nav.getByRole("link", { name: "Find" }).focus()
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/section=find/)
})

test("scrubbing navigates only on release and invokes an action once", async ({
  page,
}) => {
  const nav = page.getByRole("navigation", { name: "Main navigation" })
  const find = (await nav.getByRole("link", { name: "Find" }).boundingBox())!
  const workspace = (await nav
    .getByRole("link", { name: "Workspace" })
    .boundingBox())!
  await page.mouse.move(find.x + find.width / 2, find.y + find.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    workspace.x + workspace.width / 2,
    workspace.y + workspace.height / 2,
    { steps: 8 }
  )
  await expect(page).not.toHaveURL(/section=workspace/)
  await page.mouse.up()
  await expect(page).toHaveURL(/section=workspace/)
  const details = (await nav.getByRole("button", { name: "Details" }).boundingBox())!
  await page.mouse.move(
    workspace.x + workspace.width / 2,
    workspace.y + workspace.height / 2
  )
  await page.mouse.down()
  await page.mouse.move(details.x + details.width / 2, details.y + details.height / 2, {
    steps: 8,
  })
  await page.mouse.up()
  await expect(page.getByText("Details opened 1 times")).toBeVisible()
})

test("releasing a drag outside cancels navigation", async ({ page }) => {
  const box = (await page
    .getByRole("navigation", { name: "Main navigation" })
    .boundingBox())!
  await page.mouse.move(box.x + 30, box.y + 30)
  await page.mouse.down()
  await page.mouse.move(box.x + 160, box.y - 40, { steps: 6 })
  await page.mouse.up()
  await expect(page).toHaveURL(/react-grab=0/)
})

test("scroll compacts the bar and upward scrolling restores labels", async ({
  page,
}) => {
  const nav = page.getByRole("navigation", { name: "Main navigation" })
  await page.locator("main").hover()
  await page.mouse.wheel(0, 450)
  await expect(nav).toHaveAttribute("data-compact", "true")
  for (const target of await nav.locator("a,button").all())
    expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await page.mouse.wheel(0, -200)
  await expect(nav).toHaveAttribute("data-compact", "false")
})

test("long forms scroll within a narrow viewport and remain dismissible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.getByRole("button", { name: "Edit plan" }).click()
  const dialog = page.getByRole("dialog", { name: "Edit your community plan" })
  const box = (await dialog.boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.y + box.height).toBeLessThanOrEqual(568)
  await dialog.getByLabel("Milestone 6").fill("Ready for launch")
  await dialog.getByRole("button", { name: "Done", exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Edit plan" })).toBeFocused()
})

test("desktop has no floating mobile bar", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(
    page.getByRole("navigation", { name: "Main navigation" })
  ).toBeHidden()
})
