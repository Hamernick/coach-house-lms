import { readFileSync } from "node:fs"
import { expect, test, type Page } from "@playwright/test"

const planners = [
  ["Campaigns", "tools/campaigns", 3],
  ["CRM", "tools/crm", 4],
  ["Finance", "tools/finance", 3],
  ["HR", "tools/hr", 3],
  ["Legal", "tools/legal", 3],
  ["Networking", "tools/networking", 3],
  ["Social media", "tools/social-media", 5],
  ["Compliance", "best-practices/compliance", 2],
  ["Frameworks", "best-practices/frameworks", 2],
  ["Fundraising", "best-practices/fundraising", 3],
  ["Marketing", "best-practices/marketing", 3],
  ["Measuring impact", "best-practices/measuring-impact", 2],
  ["Partnerships", "best-practices/partnerships", 2],
  ["Sustainability", "best-practices/sustainability", 2],
] as const

async function closeEditor(page: Page) {
  await page
    .locator("[data-canvas-editor]")
    .getByRole("button", { name: "Collapse step", exact: true })
    .click()
  await expect(page.locator("[data-canvas-editor]")).toHaveCount(0)
}

async function runWithDialog(
  page: Page,
  action: () => Promise<unknown>,
  resolution: "accept" | "dismiss"
) {
  let message = ""
  const handledDialog = page.waitForEvent("dialog").then(async (dialog) => {
    message = dialog.message()
    await dialog[resolution]()
  })
  await action()
  await handledDialog
  return message
}

async function listSteps(page: Page) {
  const toggle = page.getByRole("button", { name: "List view", exact: true })
  if (await toggle.isVisible()) await toggle.click()
  return page.getByRole("list", { name: "Planner steps" }).getByRole("button")
}

for (const [name, route, count] of planners) {
  test(`${name} planner preserves edits through steps, export, and reload`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.goto(`/documentation/${route}`)
    await expect(
      page.getByRole("tab", { name: /^(Tool|Overview)$/ })
    ).toHaveCount(0)
    await expect(page.locator("#definition")).toBeVisible()
    await expect(
      page.getByRole("region", { name: "Decision canvas", exact: true })
    ).toBeVisible()
    const example = page.getByRole("button", {
      name: "Load example",
      exact: true,
    })
    await expect(example).toBeEnabled()
    await example.click()
    await page
      .getByRole("button", { name: "Start planning", exact: true })
      .click()
    const firstInput = page
      .locator(
        '[data-planner-editor] input:not([type]):visible, [data-planner-editor] input[type="text"]:visible'
      )
      .first()
    await expect(page.locator("[data-canvas-editor]")).toBeVisible()
    const hasTextInput = (await firstInput.count()) > 0
    if (hasTextInput) await firstInput.fill("Planner workflow check")
    await closeEditor(page)
    const steps = await listSteps(page)
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
    await closeEditor(page)
    await steps.first().click()
    await expect(page).toHaveURL(/[?&]step=[^&#]+/)
    if (hasTextInput)
      await expect(firstInput).toHaveValue("Planner workflow check")
    await page.reload()
    await expect(page.locator("[data-canvas-editor]")).toBeVisible()
    if (hasTextInput)
      await expect(firstInput).toHaveValue("Planner workflow check")
    expect(errors).toEqual([])
  })
}

test("planner examples preserve existing work when replacement is cancelled", async ({
  page,
}) => {
  await page.goto("/documentation/tools/crm#sandbox")
  await page
    .getByRole("button", { name: "Start planning", exact: true })
    .click()
  const name = page.getByLabel("Organization name", { exact: true })
  await name.fill("Keep this draft")
  await closeEditor(page)
  page.once("dialog", (dialog) => dialog.dismiss())
  await page.getByRole("button", { name: "Load example", exact: true }).click()
  await page
    .getByRole("button", { name: "Start planning", exact: true })
    .click()
  await expect(name).toHaveValue("Keep this draft")
  await closeEditor(page)
  page.once("dialog", (dialog) => dialog.accept())
  await page.getByRole("button", { name: "Load example", exact: true }).click()
  await page
    .getByRole("button", { name: "Start planning", exact: true })
    .click()
  await expect(name).toHaveValue("Willow Street Family Resource Network")
})

test("malformed saved drafts stay intact until the user confirms reset", async ({
  page,
}) => {
  const key = "coach-house:documentation:crm-data-stewardship-plan:v1"
  const storedBytes = "{malformed legacy draft"
  await page.addInitScript(
    ({ key, storedBytes }) => {
      const originalSetItem = Storage.prototype.setItem
      originalSetItem.call(localStorage, key, storedBytes)
    },
    { key, storedBytes }
  )
  await page.goto("/documentation/tools/crm#sandbox")
  await expect(
    page.getByText("Browser saving is unavailable.", { exact: false })
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Start planning", exact: true })
    .click()
  await page
    .getByLabel("Organization name", { exact: true })
    .fill("Keep this unsaved edit")
  expect(
    await page.evaluate((storageKey) => localStorage[storageKey], key)
  ).toBe(storedBytes)

  await closeEditor(page)
  const navigationMessage = await runWithDialog(
    page,
    () => page.locator('a[href="/documentation/quickstart"]').click(),
    "dismiss"
  )
  expect(navigationMessage).toContain("unsaved changes")
  await expect(page).toHaveURL(
    /\/documentation\/tools\/crm(?:\?step=[^#]+)?#sandbox$/
  )
  const search = page.getByRole("searchbox", {
    name: "Search documentation",
    exact: true,
  })
  await search.fill("mission")
  const searchMessage = await runWithDialog(
    page,
    () => search.press("Enter"),
    "dismiss"
  )
  expect(searchMessage).toContain("unsaved changes")
  await expect(page).toHaveURL(
    /\/documentation\/tools\/crm(?:\?step=[^#]+)?#sandbox$/
  )
  expect(
    await page.evaluate((storageKey) => localStorage[storageKey], key)
  ).toBe(storedBytes)

  await runWithDialog(
    page,
    () => page.getByRole("button", { name: "Reset", exact: true }).click(),
    "accept"
  )
  await expect(page.getByText("Saved in this browser")).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate((storageKey) => {
        const saved = JSON.parse(localStorage[storageKey] ?? "null")
        return saved?.organizationName
      }, key)
    )
    .toBe("")
})

test("a blocked saved-draft read never enables the default draft overwrite", async ({
  page,
}) => {
  const key = "coach-house:documentation:crm-data-stewardship-plan:v1"
  const storedBytes = "preserve these bytes when reads are blocked"
  await page.addInitScript(
    ({ key, storedBytes }) => {
      const originalSetItem = Storage.prototype.setItem
      const originalGetItem = Storage.prototype.getItem
      originalSetItem.call(localStorage, key, storedBytes)
      Storage.prototype.getItem = function (candidateKey) {
        if (candidateKey === key) throw new Error("Storage read blocked")
        return originalGetItem.call(this, candidateKey)
      }
    },
    { key, storedBytes }
  )
  await page.goto("/documentation/tools/crm#sandbox")
  await expect(
    page.getByText("Browser saving is unavailable.", { exact: false })
  ).toBeVisible()
  expect(
    await page.evaluate((storageKey) => localStorage[storageKey], key)
  ).toBe(storedBytes)
  await page
    .getByRole("button", { name: "Start planning", exact: true })
    .click()
  await page
    .getByLabel("Organization name", { exact: true })
    .fill("Cannot replace a failed read")
  expect(
    await page.evaluate((storageKey) => localStorage[storageKey], key)
  ).toBe(storedBytes)
})

test("failed draft writes warn on navigation while keeping export available", async ({
  page,
}) => {
  const key = "coach-house:documentation:crm-data-stewardship-plan:v1"
  await page.addInitScript((storageKey) => {
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = function (candidateKey, value) {
      if (candidateKey === storageKey) throw new Error("Storage is full")
      return originalSetItem.call(this, candidateKey, value)
    }
  }, key)
  await page.goto("/documentation/tools/crm#sandbox")
  await expect(
    page.getByText("Browser saving is unavailable.", { exact: false })
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Start planning", exact: true })
    .click()
  await page
    .getByLabel("Organization name", { exact: true })
    .fill("Export this unsaved organization")

  const editor = page.locator("[data-canvas-editor]")
  const collapse = editor.getByRole("button", {
    name: "Collapse step",
    exact: true,
  })
  if (await collapse.count()) await collapse.click()
  await page.getByRole("button", { name: "List view", exact: true }).click()
  await page
    .getByRole("list", { name: "Planner steps" })
    .getByRole("button")
    .last()
    .click()
  const download = page.waitForEvent("download")
  await page
    .getByRole("button", { name: "Download plan CSV", exact: true })
    .click()
  const file = await download
  expect(file.suggestedFilename()).toMatch(/\.csv$/)
  expect(readFileSync((await file.path())!, "utf8")).toContain(
    "Export this unsaved organization"
  )

  const navigationCollapse = page
    .locator("[data-canvas-editor]")
    .getByRole("button", { name: "Collapse step", exact: true })
  if (await navigationCollapse.count()) await navigationCollapse.click()
  const navigationMessage = await runWithDialog(
    page,
    () => page.locator('a[href="/documentation/quickstart"]').click(),
    "dismiss"
  )
  expect(navigationMessage).toContain("unsaved changes")
  await expect(page).toHaveURL(
    /\/documentation\/tools\/crm(?:\?step=[^#]+)?#sandbox$/
  )
  expect(
    await page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true })
      window.dispatchEvent(event)
      return event.defaultPrevented
    })
  ).toBe(true)
})

test("overview and planner share one page and preserve drafts through anchor history", async ({
  page,
}) => {
  await page.goto("/documentation/tools/campaigns")
  await expect(
    page.getByRole("tab", { name: /^(Tool|Overview)$/ })
  ).toHaveCount(0)
  const canvas = page.getByRole("region", {
    name: "Decision canvas",
    exact: true,
  })
  await expect(canvas).toBeVisible()
  expect(
    await page.locator("#sandbox").evaluate((tool) => {
      const introduction = document.getElementById("stages")!
      const example = document.getElementById("example")!
      return (
        Boolean(
          introduction.compareDocumentPosition(tool) &
          Node.DOCUMENT_POSITION_FOLLOWING
        ) &&
        Boolean(
          tool.compareDocumentPosition(example) &
          Node.DOCUMENT_POSITION_FOLLOWING
        )
      )
    })
  ).toBe(true)
  await page.getByRole("link", { name: "Try it", exact: true }).click()
  await expect(page).toHaveURL(/#sandbox$/)
  await expect(page.locator("[data-decision-viewport]")).toBeInViewport()
  await page
    .getByRole("button", { name: "Start planning", exact: true })
    .click()
  const name = page.getByLabel("Organization name", { exact: true })
  await name.fill("History check")
  await page
    .getByRole("button", { name: "Reviewed & continue", exact: true })
    .click()
  await expect(page).toHaveURL(/step=delivery#sandbox$/)
  await page.goBack()
  await expect(name).toHaveValue("History check")
  await page.goForward()
  await expect(page.locator("[data-canvas-editor]")).toContainText(
    "Delivery & measurement"
  )
  await closeEditor(page)
  await page.getByRole("link", { name: "Example", exact: true }).click()
  await expect(page).toHaveURL(/#example$/)
  await expect(page.locator("#example")).toBeInViewport()
  await expect(canvas).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/#sandbox$/)
  await page.goBack()
  await expect(page.locator("[data-canvas-editor]")).toContainText(
    "Delivery & measurement"
  )
  await page.goto("/documentation/tools/campaigns#guide")
  await expect(page.locator("#guide")).toBeInViewport()
  await expect(canvas).toBeVisible()
  await expect(page.locator("[data-canvas-editor]")).toHaveCount(0)
  await page.goto("/documentation/tools/campaigns?step=brief")
  await expect(name).toHaveValue("History check")
  await expect(page.locator("[data-decision-viewport]")).toBeInViewport()
  await page.goto("/documentation/tools/campaigns#tool-campaign")
  await expect(page.locator("[data-decision-viewport]")).toBeInViewport()
  await expect(canvas).toBeVisible()
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
  await page
    .getByRole("button", { name: "Start planning", exact: true })
    .click()
  const name = page.getByLabel("Organization name", { exact: true })
  await name.fill("Keep organization identity")
  await closeEditor(page)
  await page.getByRole("combobox", { name: "Campaign goal" }).click()
  await page
    .getByRole("option", { name: "Volunteer recruitment", exact: true })
    .click()
  page.once("dialog", (dialog) => dialog.dismiss())
  await page.getByRole("button", { name: "Use starter", exact: true }).click()
  await page
    .getByRole("button", { name: "Start planning", exact: true })
    .click()
  await expect(name).toHaveValue("Keep organization identity")
  await closeEditor(page)
  page.once("dialog", (dialog) => dialog.accept())
  await page.getByRole("button", { name: "Use starter", exact: true }).click()
  await page
    .getByRole("button", { name: "Start planning", exact: true })
    .click()
  await expect(name).toHaveValue("Keep organization identity")
  await expect(
    page.getByLabel("Working campaign name", { exact: true })
  ).toHaveValue("Google Ad Grants: Volunteer recruitment")
  await expect(page).not.toHaveURL(/template=/)
  await closeEditor(page)
  await (await listSteps(page)).last().click()
  await expect(page.locator("[data-canvas-editor]")).toContainText(
    "submitted applications"
  )
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
  await page.getByRole("button", { name: "Load example", exact: true }).click()
  await expect(
    page.getByText(
      "Browser saving is unavailable. Export your latest changes before leaving.",
      { exact: true }
    )
  ).toBeVisible()
  await (await listSteps(page)).last().click()
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
      await page
        .getByRole("button", { name: "Load example", exact: true })
        .click()
      const steps = await listSteps(page)
      await steps.last().click()
      await expect(
        page.getByRole("button", { name: /Download.*CSV/ }).first()
      ).toBeVisible()
      expect(
        await page
          .locator("[data-planner-editor]")
          .evaluate((el) => el.scrollWidth <= el.clientWidth),
        `${name} review should fit mobile`
      ).toBe(true)
      await closeEditor(page)
      await steps.first().click()
      expect(
        await page
          .locator("[data-planner-editor]")
          .evaluate((el) => el.scrollWidth <= el.clientWidth),
        `${name} fields should fit mobile`
      ).toBe(true)
      await closeEditor(page)
      expect(
        await page
          .locator("[data-documentation-scroll]")
          .evaluate((el) => el.scrollWidth <= el.clientWidth),
        `${name} canvas should fit mobile`
      ).toBe(true)
    }
  })
}
