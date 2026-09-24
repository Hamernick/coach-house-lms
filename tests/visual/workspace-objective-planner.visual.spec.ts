import { expect, test, type Page } from "@playwright/test"
const ROUTE = "/visual-regression/workspace-particles"
const suffix = process.platform === "linux" ? "-linux" : ""
async function state(page: Page) {
  return JSON.parse(
    await page.locator("[data-particle-fixture-state]").innerText()
  )
}
async function open(page: Page, theme = "light") {
  await page.addInitScript(
    (value) => localStorage.setItem("theme", value),
    theme
  )
  await page.goto(ROUTE)
  await expect(
    page.getByRole("button", { name: "Plan objective", exact: true })
  ).toBeEnabled()
  await page.addStyleTag({
    content:
      "nextjs-portal, [data-testid=react-grab-overlay] { display: none !important; }",
  })
}
async function create(page: Page) {
  await page
    .getByRole("button", { name: "Plan objective", exact: true })
    .click()
  const dialog = page.getByRole("dialog")
  await dialog
    .getByLabel("Objective", { exact: true })
    .fill("Launch neighborhood training")
  await dialog
    .getByLabel("Planning notes", { exact: true })
    .fill("Train five neighbors in practical repair skills.")
  await dialog
    .getByLabel("Decision question", { exact: true })
    .fill("Do we have a training site?")
  await dialog
    .getByLabel("If yes", { exact: true })
    .fill("Schedule the first session")
  await dialog
    .getByLabel("If no", { exact: true })
    .fill("Find a community partner")
  await dialog
    .getByLabel("Steps", { exact: true })
    .fill("Draft curriculum\nRecruit five trainees")
  await dialog
    .getByLabel("Tools / Connections", { exact: true })
    .fill("Local training partner")
  await dialog.getByLabel("Social", { exact: true }).fill("Email newsletter")
  await dialog
    .getByRole("button", { name: "Add to canvas", exact: true })
    .click()
  await expect(dialog).toHaveCount(0)
  await expect.poll(async () => (await state(page)).items.length).toBe(8)
  await page.getByRole("button", { name: "Particles", exact: true }).click()
}
test("objective decision branches, completion, edits and reload persist", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await open(page)
  await create(page)
  const decision = page
    .locator('[data-particle-kind="plan"]')
    .filter({
      has: page.getByRole("heading", { name: "Decision", exact: true }),
    })
  await decision.getByRole("radio", { name: "No", exact: true }).click()
  const noAction = page.getByRole("checkbox", {
    name: "Find a community partner",
    exact: true,
  })
  await expect(noAction).toBeEnabled()
  await noAction.check()
  await page
    .getByRole("checkbox", { name: "Draft curriculum", exact: true })
    .check()
  await expect
    .poll(async () => (await state(page)).plans[0].decision.noComplete)
    .toBe(true)
  const saved = await state(page)
  await page.reload()
  await expect.poll(async () => (await state(page)).plans).toEqual(saved.plans)
  await page.getByRole("button", { name: "Particles", exact: true }).click()
  await expect(noAction).toBeChecked()
  await decision.locator(".workspace-card-drag-handle").click()
  await page
    .getByRole("button", {
      name: "Edit Launch neighborhood training plan",
      exact: true,
    })
    .click()
  await page
    .getByRole("dialog")
    .getByLabel("Steps", { exact: true })
    .fill("Revise curriculum\nRecruit five trainees")
  await page.getByRole("button", { name: "Save plan", exact: true }).click()
  await expect
    .poll(async () => (await state(page)).plans[0].steps[0].complete)
    .toBe(false)
  expect((await state(page)).items).toEqual(saved.items)
  await page.getByRole("button", { name: "View only", exact: true }).click()
  await expect(noAction).toBeDisabled()
  await expect(
    decision.getByRole("radio", { name: "Yes", exact: true })
  ).toBeDisabled()
})
for (const theme of ["light", "dark"]) {
  test(`objective tree and mobile editor in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await open(page, theme)
    await create(page)
    await expect(
      page.locator(".react-flow__node-workspace-particle")
    ).toHaveCount(8)
    await expect(page).toHaveScreenshot(
      `objective-tree-${theme}${suffix}.png`,
      { animations: "disabled" }
    )
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole("button", { name: "Particles", exact: true }).click()
    await page
      .getByRole("button", { name: "Plan objective", exact: true })
      .click()
    await page
      .getByRole("dialog")
      .getByLabel("Objective", { exact: true })
      .fill("Plan a workshop")
    await expect(page.getByRole("dialog")).toHaveScreenshot(
      `objective-editor-mobile-${theme}${suffix}.png`,
      { animations: "disabled" }
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
    let calls = 0
    await page.route("**/api/workspace/objectives/plan", () => {
      calls++
    })
    await page
      .getByRole("button", { name: "Draft with AI", exact: true })
      .click()
    await expect(page.getByRole("alert")).toContainText("sample preview")
    expect(calls).toBe(0)
  })
}
