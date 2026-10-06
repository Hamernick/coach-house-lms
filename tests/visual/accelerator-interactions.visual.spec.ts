import { expect, test } from "@playwright/test"

test.use({ extraHTTPHeaders: { "x-coach-house-visual-regression": "1" } })

for (const [width, colorScheme] of [[1440, "light"], [390, "dark"]] as const) {
  test(`accelerator completion, resources, and editable setup (${width})`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.emulateMedia({ colorScheme })
    await page.route("**/api/public/**", (route) => route.fulfill({ json: { available: true } }))
    await page.addInitScript(() => localStorage.setItem("onboardingDraftV2", JSON.stringify({ values: { orgName: "Stale name", orgSlug: "stale-url" } })))
    await page.goto("/visual-regression/project-feedback?scenario=accelerator")
    const lesson = page.getByTestId("lesson-preview")
    await expect(lesson.getByRole("button", { name: "AI", exact: true })).toHaveCount(0)

    await page.getByRole("button", { name: "Fail saves", exact: true }).click()
    await lesson.getByRole("button", { name: "Done reviewing this lesson" }).click()
    await expect(page.getByText("Simulated save failure", { exact: true })).toBeVisible()
    await expect(lesson).toBeVisible()
    await expect(page.getByRole("status").filter({ hasText: "Persisted not started" })).toBeVisible()

    await page.getByRole("button", { name: "Allow saves", exact: true }).click()
    await lesson.locator("video").dispatchEvent("ended")
    await expect(page.getByRole("status").filter({ hasText: "Persisted completed" })).toBeVisible()
    await lesson.getByRole("button", { name: "Done reviewing this lesson" }).click()
    await expect(page.getByText("Overview: Completed", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Reopen lesson", exact: true }).click()
    await expect(page.getByRole("status").filter({ hasText: "Persisted completed" })).toBeVisible()

    await expect(page.getByTestId("resource-preview").getByRole("link", { name: "Open resource: Register your nonprofit" })).toHaveAttribute("href", "https://example.org/register")
    const setup = page.getByTestId("setup-preview")
    await expect(setup.locator("#orgName")).toHaveValue("Saved organization")
    await setup.locator("#orgName").fill("Updated organization")
    await expect(setup.locator("#orgSlug")).toHaveValue("stable-url")
    await setup.getByRole("button", { name: "Continue", exact: true }).click()
    await expect(setup.locator("#firstName")).toHaveValue("Test")
    await setup.getByRole("button", { name: "Back", exact: true }).click()
    await expect(setup.locator("#orgName")).toHaveValue("Updated organization")
  })
}
