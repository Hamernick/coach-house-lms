import { expect, test, type Page } from "@playwright/test"

const FIXTURE_PATH = "/visual-regression/fiscal-sponsorship-role-journeys"

test.describe.configure({ timeout: 60_000 })

async function openFixture(page: Page) {
  await page.goto(FIXTURE_PATH, { waitUntil: "domcontentloaded" })
  await expect(
    page.locator("[data-fiscal-sponsorship-role-journey-fixture]")
  ).toBeVisible()
  await expect(page.getByTestId("role-journey-hydrated")).toHaveAttribute(
    "data-hydrated",
    "true",
    { timeout: 45_000 }
  )
}

test("applicant can resume the application without review controls", async ({
  page,
}) => {
  await openFixture(page)

  const workbench = page.locator(
    "[data-fiscal-sponsorship-project-workbench='project-1']"
  )
  await expect(workbench).toBeVisible()
  await expect(
    workbench.getByRole("button", { name: "Approve", exact: true })
  ).toHaveCount(0)
  await workbench.getByRole("button", { name: "Edit" }).click()
  await expect(
    workbench.getByRole("region", {
      name: "Fiscal sponsorship application editor",
    })
  ).toBeVisible()
  await workbench.getByRole("button", { name: "Save draft" }).click()
  await expect(page.getByTestId("role-journey-result")).toHaveText(
    "Applicant draft saved"
  )
})

test("assigned coach can approve but cannot edit applicant data", async ({
  page,
}) => {
  await openFixture(page)
  await page.getByRole("button", { name: "Assigned coach" }).click()

  const workbench = page.locator(
    "[data-fiscal-sponsorship-project-workbench='project-1']"
  )
  await expect(workbench.getByRole("button", { name: "Edit" })).toBeDisabled()
  await workbench.getByRole("button", { name: "Approve", exact: true }).click()
  await expect(page.getByTestId("role-journey-result")).toHaveText(
    "Application approved by assigned coach"
  )
})

test("sponsor operator can prepare the approved agreement", async ({
  page,
}) => {
  await openFixture(page)
  await page.getByRole("button", { name: "Sponsor operator" }).click()

  const workbench = page.locator(
    "[data-fiscal-sponsorship-project-workbench='project-1']"
  )
  await workbench.getByRole("button", { name: "Prepare agreement" }).click()
  await expect(page.getByTestId("role-journey-result")).toHaveText(
    "Agreement prepared by sponsor operator"
  )
})

test("unassigned role receives no fiscal workbench controls", async ({
  page,
}) => {
  await openFixture(page)
  await page.getByRole("button", { name: "Denied role" }).click()

  await expect(page.locator("[data-slot='alert']")).toContainText(
    "You are not assigned to this fiscal sponsorship project."
  )
  await expect(
    page.locator("[data-fiscal-sponsorship-project-workbench]")
  ).toHaveCount(0)
})
