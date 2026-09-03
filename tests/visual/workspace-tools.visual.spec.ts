import { expect, test, type Page } from "@playwright/test"

type DriveState = "connected" | "disconnected" | "error"

async function openToolsFixture(page: Page, state: DriveState) {
  await page.route("**/api/integrations/google-drive/connection", (route) => {
    if (state === "error") {
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, code: "not_configured" }),
      })
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        connection:
          state === "connected"
            ? {
                connected: true,
                googleEmail: "caleb@example.org",
                status: "connected",
              }
            : {
                connected: false,
                googleEmail: null,
                status: "not_connected",
              },
      }),
    })
  })

  await page.goto("/visual-regression/workspace-tools")
  await page.waitForLoadState("networkidle")
}

test("Workspace Tools shows a recoverable Drive failure", async ({ page }) => {
  await openToolsFixture(page, "error")

  const fixture = page.locator("[data-workspace-tools-visual-fixture]")
  await expect(fixture.getByRole("alert")).toContainText(
    "Google Drive Isn’t Available"
  )
  await expect(fixture.getByRole("button", { name: "Try Again" })).toBeVisible()
  await expect(fixture).toHaveScreenshot("workspace-tools-drive-error.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
    maxDiffPixelRatio: 0.02,
  })
})

test("Workspace Tools shows a connected Drive account", async ({ page }) => {
  await openToolsFixture(page, "connected")

  const fixture = page.locator("[data-workspace-tools-visual-fixture]")
  await expect(fixture).toContainText("caleb@example.org")
  await expect(fixture).toContainText("Connected")
  const connectionSwitch = fixture.getByRole("switch", {
    name: "Google Drive connection",
  })
  await expect(connectionSwitch).toBeChecked()
  await connectionSwitch.click()
  await expect(
    page.getByRole("alertdialog", { name: "Disconnect Google Drive?" })
  ).toBeVisible()
  await page.getByRole("button", { name: "Cancel" }).click()
  await expect(connectionSwitch).toBeChecked()
  await expect(fixture).toHaveScreenshot(
    "workspace-tools-drive-connected.png",
    {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      maxDiffPixelRatio: 0.02,
    }
  )
})

test("Workspace Tools Drive state fits a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openToolsFixture(page, "disconnected")

  const fixture = page.locator("[data-workspace-tools-visual-fixture]")
  const connectionSwitch = fixture.getByRole("switch", {
    name: "Google Drive connection",
  })
  await expect(connectionSwitch).toBeVisible()
  await expect(connectionSwitch).not.toBeChecked()
  await expect(fixture).toContainText("Not connected")
  await expect(fixture).toHaveScreenshot("workspace-tools-drive-mobile.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
    maxDiffPixelRatio: 0.02,
  })
})
