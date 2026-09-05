import { expect, test, type Page } from "@playwright/test"

async function ready(page: Page) {
  await page.locator("[data-documentation-scroll]").waitFor()
  await page.waitForLoadState("networkidle")
  if ((page.viewportSize()?.width ?? 1440) < 768) {
    await expect(
      page.getByRole("button", { name: /documentation navigation/ })
    ).toBeVisible()
  }
  const loadExample = page.getByRole("button", {
    name: "Load example",
    exact: true,
  })
  if (await loadExample.count()) await expect(loadExample).toBeEnabled()
  await page.addStyleTag({
    content:
      "[data-testid='react-grab-overlay'], nextjs-portal { visibility: hidden !important; }",
  })
}

test("library search supports keyboard, deep links, browser history, and empty recovery", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/documentation")
  await ready(page)
  const input = page.getByRole("searchbox", {
    name: "Search documentation",
    exact: true,
  })
  await expect(page.getByRole("searchbox")).toHaveCount(1)
  await page.keyboard.press("Control+k")
  await expect(input).toBeFocused()
  await input.fill("color proportions")
  await input.press("Enter")
  await expect(page).toHaveURL(/\/documentation\/search\?q=color\+proportions$/)
  const results = page.getByRole("list", {
    name: "Documentation search results",
  })
  await expect(results.getByRole("link")).toHaveCount(1)
  await results.getByRole("link").click()
  await expect(page).toHaveURL(/\/tools\/brand-identity#color-palette$/)
  await ready(page)
  await expect(page.locator("#color-palette")).toBeInViewport()
  await page.goBack()
  await expect(input).toHaveValue("color proportions")
  await page.goForward()
  await expect(page).toHaveURL(/#color-palette$/)
  await page.goto("/documentation/search?q=qzxnotaword")
  await expect(
    page.getByRole("heading", { name: "No matching pages" })
  ).toBeVisible()
  await page.getByRole("link", { name: "Clear search", exact: true }).click()
  await expect(input).toHaveValue("")
  await expect(
    page.getByRole("heading", { name: "Explore a topic" })
  ).toBeVisible()
  expect(errors).toEqual([])
})

test("CRM draft survives search, navigation, reload, export, and confirmed reset", async ({
  page,
}) => {
  await page.goto("/documentation/tools/crm#sandbox")
  await ready(page)
  await page.getByRole("button", { name: "Load example", exact: true }).click()
  const organization = page.getByLabel("Organization name", { exact: true })
  await expect(organization).toHaveValue(
    "Willow Street Family Resource Network"
  )
  await organization.fill("Local review organization")
  const search = page.getByRole("searchbox", {
    name: "Search documentation",
    exact: true,
  })
  await search.fill("mission")
  await search.press("Enter")
  await expect(
    page.getByRole("heading", { name: "Search results" })
  ).toBeVisible()
  await page.goBack()
  await ready(page)
  await expect(organization).toHaveValue("Local review organization")
  await page.reload()
  await ready(page)
  await expect(organization).toHaveValue("Local review organization")
  await page.getByRole("tab", { name: /Review & export/ }).click()
  const download = page.waitForEvent("download")
  await page
    .getByRole("button", { name: "Download plan CSV", exact: true })
    .click()
  expect((await download).suggestedFilename()).toBe(
    "nonprofit-crm-data-stewardship-plan.csv"
  )
  page.once("dialog", (dialog) => dialog.accept())
  await page.getByRole("button", { name: "Reset", exact: true }).click()
  await page.getByRole("tab", { name: /Purpose/ }).click()
  await expect(organization).toHaveValue("")
})

test("Marketplace retains resource filters, shortlist persistence, and export", async ({
  page,
}) => {
  await page.goto("/documentation/marketplace")
  await ready(page)
  await expect(page.locator("[data-marketplace-results-count]")).toHaveText(
    "23 resources"
  )
  await page
    .getByRole("searchbox", { name: "Search resources", exact: true })
    .fill("TechSoup")
  await expect(page.locator("[data-marketplace-results-count]")).toHaveText(
    "2 resources"
  )
  await page
    .getByRole("button", { name: /^Save TechSoup/ })
    .first()
    .click()
  await page.reload()
  await expect(page.locator("[data-marketplace-shortlist-count]")).toHaveText(
    "1"
  )
  await expect(
    page.getByRole("button", { name: /^Remove TechSoup/ })
  ).toBeVisible()
  await page.getByRole("button", { name: "Saved 1", exact: true }).click()
  const download = page.waitForEvent("download")
  await page.getByRole("button", { name: /Download CSV/ }).click()
  expect((await download).suggestedFilename()).toBe(
    "coach-house-marketplace-shortlist.csv"
  )
})

test("mobile navigation closes after choosing a guide and contents links reach sections", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/documentation")
  await ready(page)
  await page.getByRole("button", { name: /documentation navigation/ }).click()
  const rail = page.getByRole("navigation", {
    name: "Documentation navigation",
    exact: true,
  })
  await rail.getByRole("link", { name: "Quickstart", exact: true }).click()
  await expect(page).toHaveURL(/\/documentation\/quickstart$/)
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await page.getByRole("button", { name: "On this page", exact: true }).click()
  await page
    .getByRole("navigation", { name: "Article contents", exact: true })
    .getByRole("link", { name: "Readiness checklist", exact: true })
    .click()
  await expect(page).toHaveURL(/#checklist$/)
  await expect(page.locator("#checklist-title")).toBeInViewport()
  const headingBounds = await page.locator("#checklist-title").boundingBox()
  const searchBounds = await page
    .getByRole("search", { name: "Documentation", exact: true })
    .boundingBox()
  expect(headingBounds!.y).toBeGreaterThan(
    searchBounds!.y + searchBounds!.height
  )
})

for (const viewer of ["free", "paid", "locked"]) {
  test(`documentation remains available in the ${viewer} account shell`, async ({
    page,
  }) => {
    await page.goto(`/visual-regression/documentation?viewer=${viewer}`)
    await ready(page)
    await expect(
      page.getByRole("heading", { name: "Nonprofit documentation", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("searchbox", { name: "Search documentation", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("navigation", {
        name: "Documentation navigation",
        exact: true,
      })
    ).toHaveCount(1)
  })
}

for (const mode of ["light", "dark"] as const) {
  test(`documentation search and article fit mobile in ${mode} mode`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" })
    await page.addInitScript(
      (theme) => localStorage.setItem("theme", theme),
      mode
    )
    await page.goto("/documentation/search?q=CRM")
    await ready(page)
    const search = page.getByRole("searchbox", {
      name: "Search documentation",
      exact: true,
    })
    expect(
      await search.evaluate((input) =>
        parseFloat(getComputedStyle(input).fontSize)
      )
    ).toBeGreaterThanOrEqual(16)
    expect(
      await page
        .locator("[data-documentation-scroll]")
        .evaluate((el) => el.scrollWidth <= el.clientWidth)
    ).toBe(true)
    await expect(page).toHaveScreenshot(
      `documentation-search-mobile-${mode}.png`,
      { animations: "disabled", caret: "hide", maxDiffPixelRatio: 0.01 }
    )
    await page
      .getByRole("list", { name: "Documentation search results" })
      .getByRole("link")
      .first()
      .click()
    await ready(page)
    await expect(page).toHaveURL(/\/documentation\/tools\/crm$/)
    expect(
      await page
        .locator("[data-documentation-scroll]")
        .evaluate((el) => el.scrollWidth <= el.clientWidth)
    ).toBe(true)
    await expect(page).toHaveScreenshot(
      `documentation-article-mobile-${mode}.png`,
      { animations: "disabled", caret: "hide", maxDiffPixelRatio: 0.01 }
    )
    for (const [route, surface] of [
      ["/documentation/marketplace", "marketplace"],
      ["/documentation", "home"],
    ]) {
      await page.goto(route)
      await ready(page)
      expect(
        await page
          .locator("[data-documentation-scroll]")
          .evaluate((el) => el.scrollWidth <= el.clientWidth)
      ).toBe(true)
      await expect(page).toHaveScreenshot(
        `documentation-${surface}-mobile-${mode}.png`,
        {
          animations: "disabled",
          caret: "hide",
          maxDiffPixelRatio: 0.01,
        }
      )
    }
  })
}

test("documentation home and article desktop baselines", async ({ page }) => {
  await page.goto("/documentation")
  await ready(page)
  await expect(page).toHaveScreenshot("documentation-home-desktop.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixelRatio: 0.01,
  })
  await page.goto("/documentation/best-practices/mission")
  await ready(page)
  await expect(page).toHaveScreenshot("documentation-article-desktop.png", {
    animations: "disabled",
    caret: "hide",
    maxDiffPixelRatio: 0.01,
  })
  for (const [route, surface] of [
    ["/documentation/marketplace", "marketplace"],
    ["/documentation/tools/brand-identity", "brand-identity"],
  ]) {
    await page.goto(route)
    await ready(page)
    if (surface === "brand-identity")
      await expect(
        page.getByRole("status").filter({ hasText: "Saved on this device" })
      ).toBeVisible()
    await expect(page).toHaveScreenshot(
      `documentation-${surface}-desktop.png`,
      {
        animations: "disabled",
        caret: "hide",
        maxDiffPixelRatio: 0.01,
      }
    )
  }
})

test("Marketplace People preserves filters through back and forward navigation", async ({
  page,
}) => {
  await page.goto("/documentation/marketplace?q=Design%20Gigs")
  await expect(page.locator("[data-marketplace-results-count]")).toHaveText(
    "1 resource"
  )
  await page.getByRole("tab", { name: "People", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Coach House coaches" })
  ).toBeVisible()
  await expect(page.locator("[data-marketplace-coach]")).toHaveCount(3)
  await expect(
    page.locator('[data-marketplace-coach="joel"] a').last()
  ).toHaveAttribute("href", "/coaching")
  await expect(
    page.locator('[data-marketplace-coach="paula"] a').last()
  ).toHaveAttribute("href", "/coaching")
  await expect(
    page.locator('[data-marketplace-coach="franklin"] a').last()
  ).toHaveAttribute("href", "https://www.coachhousesolutions.org/contact")
  await page.goBack()
  await expect(
    page.getByRole("searchbox", { name: "Search resources", exact: true })
  ).toHaveValue("Design Gigs")
  await expect(page.locator("[data-marketplace-results-count]")).toHaveText(
    "1 resource"
  )
  await page.goForward()
  await expect(
    page.getByRole("tab", { name: "People", exact: true })
  ).toHaveAttribute("aria-selected", "true")
  await page.reload()
  await expect(page.locator("[data-marketplace-coach]")).toHaveCount(3)
})

test("Marketplace resource guides lead from discovery to setup and saved choices", async ({
  page,
}) => {
  await page.goto("/documentation/marketplace?q=Ad%20Grants")
  await page
    .getByRole("link", { name: "Google Ad Grants", exact: true })
    .click()
  await expect(page).toHaveURL(/marketplace\/google-ad-grants$/)
  await expect(
    page.getByRole("heading", { name: "Google Ad Grants", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Follow Google's activation steps" })
  ).toHaveAttribute("href", "https://www.google.com/grants/get-started/")
  await expect(
    page.getByRole("heading", { name: "Fundraising", exact: true })
  ).toBeAttached()
  await expect(
    page.getByRole("heading", { name: "Volunteer recruitment", exact: true })
  ).toBeAttached()
  await expect(
    page.getByRole("heading", { name: "Reach your community", exact: true })
  ).toBeAttached()
  await page
    .getByRole("button", { name: "Save Google Ad Grants", exact: true })
    .click()
  await page.reload()
  await expect(
    page.getByRole("button", {
      name: "Remove Google Ad Grants from saved resources",
      exact: true,
    })
  ).toHaveAttribute("aria-pressed", "true")
  await page.getByRole("button", { name: "Saved 1", exact: true }).click()
  await expect(
    page
      .getByRole("dialog")
      .getByRole("link", { name: "Google Ad Grants", exact: true })
  ).toHaveAttribute("href", "/documentation/marketplace/google-ad-grants")
})

test("Marketplace renders published member profiles separately from coaches", async ({
  page,
}) => {
  await page.goto("/visual-regression/documentation?viewer=people")
  await expect(page.locator("[data-marketplace-coach]")).toHaveCount(3)
  const person = page.locator(
    '[data-marketplace-person="sample-public-member"]'
  )
  await expect(person).toHaveAttribute("href", "/sample-public-member")
  await expect(person).toContainText("Public member fixture")
  await expect(person).not.toContainText("Book")
})

for (const [layout, mode, width, height] of [
  ["desktop", "light", 1440, 900],
  ["mobile", "dark", 390, 844],
] as const) {
  test(`Marketplace and completed plans have reviewed ${layout} baselines`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" })
    await page.addInitScript(
      (theme) => localStorage.setItem("theme", theme),
      mode
    )
    for (const [route, surface, planner] of [
      ["/visual-regression/documentation?viewer=people", "people", false],
      ["/documentation/marketplace/google-ad-grants", "ad-grants", false],
      ["/documentation/tools/campaigns#sandbox", "campaign-review", true],
      [
        "/documentation/best-practices/fundraising#sandbox",
        "fundraising-review",
        true,
      ],
    ] as const) {
      await page.goto(route)
      await ready(page)
      if (planner) {
        await page
          .getByRole("button", { name: "Load example", exact: true })
          .click()
        await page
          .getByRole("tablist", { name: "Planner steps" })
          .getByRole("tab")
          .last()
          .click()
        await expect(
          page.getByRole("button", { name: /Download.*CSV/ }).first()
        ).toBeVisible()
      }
      await expect(page).toHaveScreenshot(
        `documentation-${surface}-${layout}-${mode}.png`,
        {
          animations: "disabled",
          caret: "hide",
          maxDiffPixelRatio: 0.01,
        }
      )
    }
  })
}
