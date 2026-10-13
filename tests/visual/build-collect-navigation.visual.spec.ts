import { expect, test } from "@playwright/test"

test("public Build landing and hover navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/build?react-grab=0")

  await expect(
    page.getByRole("heading", {
      name: "Build the organization your community needs.",
    })
  ).toBeVisible()

  const buildMenu = page.getByRole("button", { name: "Build", exact: true })
  await buildMenu.hover()
  await expect(page.getByRole("link", { name: /Workspace/ })).toBeVisible()
  await expect(page.getByRole("link", { name: /Accelerator/ })).toBeVisible()
  await expect(page.getByRole("link", { name: /Pricing/ })).toBeVisible()

  await page.mouse.move(20, 300)
  await expect(buildMenu).toHaveAttribute("data-state", "closed")

  await expect(page).toHaveScreenshot("public-build-landing.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixelRatio: 0.02,
    scale: "css",
  })
})

test("public header search submits to the Collect root", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/build?react-grab=0")

  const search = page.getByPlaceholder("Start searching")
  await search.fill("food")
  await search.press("Enter")

  await expect(page).toHaveURL(/\?q=food/)
  await expect(
    page.getByRole("searchbox", { name: "Find organizations and resources" })
  ).toHaveValue("food")
})

test("public Build landing stays within a mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/build?react-grab=0")

  await expect(page.getByRole("link", { name: "Collect" })).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Build", exact: true })
  ).toHaveAttribute("aria-current", "page")
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    )
  ).toBe(false)

  await expect(page).toHaveScreenshot("public-build-landing-mobile.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixelRatio: 0.02,
    scale: "css",
  })
})
