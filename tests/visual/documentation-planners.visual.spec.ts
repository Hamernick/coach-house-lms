import { readFileSync } from "node:fs"
import { expect, test } from "@playwright/test"

const planners = [
  ["Campaigns", "tools/campaigns", 3],
  ["CRM", "tools/crm", 4],
  ["Finance", "tools/finance", 3],
  ["HR", "tools/hr", 3],
  ["Legal", "tools/legal", 3],
  ["Networking", "tools/networking", 3],
  ["Social media", "tools/social-media", 2],
  ["Compliance", "best-practices/compliance", 2],
  ["Frameworks", "best-practices/frameworks", 2],
  ["Fundraising", "best-practices/fundraising", 3],
  ["Marketing", "best-practices/marketing", 3],
  ["Measuring impact", "best-practices/measuring-impact", 2],
  ["Partnerships", "best-practices/partnerships", 2],
  ["Sustainability", "best-practices/sustainability", 2],
] as const

for (const [name, route, count] of planners) {
  test(`${name} planner preserves edits through steps, export, and reload`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.goto(`/documentation/${route}#sandbox`)
    const example = page.getByRole("button", {
      name: "Load example",
      exact: true,
    })
    await expect(example).toBeEnabled()
    await example.click()
    const firstInput = page
      .locator(
        '#sandbox input:not([type]):visible, #sandbox input[type="text"]:visible'
      )
      .first()
    const hasTextInput = (await firstInput.count()) > 0
    if (hasTextInput) await firstInput.fill("Planner workflow check")
    const steps = page
      .getByRole("tablist", { name: "Planner steps" })
      .getByRole("tab")
    await expect(steps).toHaveCount(count)
    await steps.last().click()
    const download = page.waitForEvent("download")
    await page
      .getByRole("button", { name: /Download.*CSV/ })
      .first()
      .click()
    const file = await download
    expect(file.suggestedFilename()).toMatch(/\.csv$/)
    const csv = readFileSync((await file.path())!, "utf8")
    expect(csv.length).toBeGreaterThan(100)
    if (hasTextInput) expect(csv).toContain("Planner workflow check")
    await steps.first().click()
    if (hasTextInput)
      await expect(firstInput).toHaveValue("Planner workflow check")
    await page.reload()
    await expect(example).toBeEnabled()
    if (hasTextInput)
      await expect(firstInput).toHaveValue("Planner workflow check")
    expect(errors).toEqual([])
  })
}

test("planner examples preserve existing work when replacement is cancelled", async ({
  page,
}) => {
  await page.goto("/documentation/tools/crm#sandbox")
  const name = page.getByLabel("Organization name", { exact: true })
  await expect(name).toBeEnabled()
  await name.fill("Keep this draft")
  page.once("dialog", (dialog) => dialog.dismiss())
  await page.getByRole("button", { name: "Load example", exact: true }).click()
  await expect(name).toHaveValue("Keep this draft")
  page.once("dialog", (dialog) => dialog.accept())
  await page.getByRole("button", { name: "Load example", exact: true }).click()
  await expect(name).toHaveValue("Willow Street Family Resource Network")
})

test("guide anchors and planner steps survive browser history without replacing drafts", async ({
  page,
}) => {
  await page.goto("/documentation/tools/campaigns#sandbox")
  const name = page.getByLabel("Organization name", { exact: true })
  await expect(name).toBeEnabled()
  await name.fill("History check")
  const step = page.getByRole("tab", { name: /Delivery & measurement/ })
  await step.click()
  await expect(page).toHaveURL(/step=delivery#sandbox$/)
  await page.getByRole("tab", { name: "Read guide", exact: true }).click()
  await expect(
    page.getByRole("tab", { name: "Read guide", exact: true })
  ).toHaveAttribute("aria-selected", "true")
  await page.goBack()
  await expect(step).toHaveAttribute("aria-selected", "true")
  await page.goBack()
  await expect(name).toBeVisible()
  await expect(name).toHaveValue("History check")
  await page.goto("/documentation/tools/campaigns#example")
  await expect(
    page.getByRole("tab", { name: "Read guide", exact: true })
  ).toHaveAttribute("aria-selected", "true")
  await expect(page.locator("#example")).toBeVisible()
})

test("Ad Grants starter uses the selected goal and does not replace work silently", async ({
  page,
}) => {
  await page.goto("/documentation/marketplace/google-ad-grants")
  await page
    .getByRole("link", { name: "Campaign planner", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Start an Ad Grants campaign" })
  ).toBeVisible()
  const name = page.getByLabel("Organization name", { exact: true })
  await expect(name).toBeEnabled()
  await name.fill("Keep organization identity")
  await page.getByRole("combobox", { name: "Campaign goal" }).click()
  await page
    .getByRole("option", { name: "Volunteer recruitment", exact: true })
    .click()
  page.once("dialog", (dialog) => dialog.dismiss())
  await page.getByRole("button", { name: "Use starter", exact: true }).click()
  await expect(name).toHaveValue("Keep organization identity")
  page.once("dialog", (dialog) => dialog.accept())
  await page.getByRole("button", { name: "Use starter", exact: true }).click()
  await expect(name).toHaveValue("Keep organization identity")
  await expect(
    page.getByLabel("Working campaign name", { exact: true })
  ).toHaveValue("Google Ad Grants: Volunteer recruitment")
  await expect(page).not.toHaveURL(/template=/)
  await page.getByRole("tab", { name: /Review & export/ }).click()
  await expect(page.locator("#sandbox")).toContainText("submitted applications")
})

test("a planner reports unavailable storage and still exports the current draft", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError")
    }
  })
  await page.goto("/documentation/tools/campaigns#sandbox")
  const example = page.getByRole("button", {
    name: "Load example",
    exact: true,
  })
  await expect(example).toBeEnabled()
  await example.click()
  await expect(
    page.getByText(
      "Browser saving is unavailable. Export before leaving this tab.",
      { exact: true }
    )
  ).toBeVisible()
  await page.getByRole("tab", { name: /Review & export/ }).click()
  const download = page.waitForEvent("download")
  await page
    .getByRole("button", { name: "Download brief CSV", exact: true })
    .click()
  expect(readFileSync((await (await download).path())!, "utf8")).toContain(
    "Willow Street Family Resource Network"
  )
})

for (const mode of ["light", "dark"] as const) {
  test(`all planner layouts fit mobile in ${mode} mode`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" })
    await page.addInitScript(
      (theme) => localStorage.setItem("theme", theme),
      mode
    )
    for (const [name, route] of planners) {
      await page.goto(`/documentation/${route}#sandbox`)
      const example = page.getByRole("button", {
        name: "Load example",
        exact: true,
      })
      await expect(example).toBeEnabled()
      await example.click()
      const steps = page
        .getByRole("tablist", { name: "Planner steps" })
        .getByRole("tab")
      await steps.last().click()
      await expect(
        page.getByRole("button", { name: /Download.*CSV/ }).first()
      ).toBeVisible()
      expect(
        await page
          .locator("[data-documentation-scroll]")
          .evaluate((el) => el.scrollWidth <= el.clientWidth),
        `${name} review should fit mobile`
      ).toBe(true)
      await steps.first().click()
      expect(
        await page
          .locator("[data-documentation-scroll]")
          .evaluate((el) => el.scrollWidth <= el.clientWidth),
        `${name} fields should fit mobile`
      ).toBe(true)
    }
  })
}
