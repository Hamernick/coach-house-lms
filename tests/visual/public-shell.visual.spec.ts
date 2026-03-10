import { expect, test, type Page } from "@playwright/test"

async function stabilizeForScreenshot(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
    `,
  })
}

test("home canvas sidebar layout", async ({ page }) => {
  await page.goto("/?section=platform")
  await page.waitForSelector("[data-shell-root]", { state: "visible" })
  await stabilizeForScreenshot(page)

  const sidebar = page.locator("[data-sidebar='sidebar']").first()
  await expect(sidebar).toHaveScreenshot("home-canvas-sidebar-platform.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
    maxDiffPixelRatio: 0.01,
  })
})

test("home canvas header auth controls", async ({ page }) => {
  await page.goto("/?section=platform")
  await page.waitForSelector("[data-shell-root]", { state: "visible" })
  await stabilizeForScreenshot(page)

  const header = page.locator("header").first()
  await expect(header).toHaveScreenshot("home-canvas-header-auth-controls.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
    maxDiffPixelRatio: 0.01,
  })
})

test("embedded pricing surface", async ({ page }) => {
  await page.goto("/pricing?embed=1")
  await page.waitForSelector("main", { state: "visible" })
  await stabilizeForScreenshot(page)

  const main = page.locator("main").first()
  await expect(main).toHaveScreenshot("pricing-embed-shell.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
    maxDiffPixelRatio: 0.015,
  })
})
