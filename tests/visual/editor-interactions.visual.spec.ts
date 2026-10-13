import { expect, test } from "@playwright/test"

const fixture = "/visual-regression/project-feedback?scenario=editors"

for (const width of [1440, 390]) {
  test(`task editor stays in the viewport inside a transformed long page (${width})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto(fixture)
    await page.getByRole("button", { name: "Open task", exact: true }).click()
    const dialog = page.getByRole("dialog", { name: "Edit task" })
    await expect(dialog).toBeVisible()
    const bounds = await dialog.boundingBox()
    expect(bounds!.y).toBeGreaterThanOrEqual(15)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(829)
    expect(bounds!.x).toBeGreaterThanOrEqual(15)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width - 15)
    await expect(dialog.locator("#task-create-title")).toHaveValue(
      "Review staff meeting structure"
    )
    await dialog.getByRole("button", { name: "To do", exact: true }).click()
    await page.getByRole("button", { name: "In progress", exact: true }).click()
    await expect(
      dialog.getByRole("button", { name: "In progress", exact: true })
    ).toBeVisible()
    await dialog
      .getByRole("button", { name: "Save changes", exact: true })
      .click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole("status")).toContainText("Task saved")
    await page.getByRole("button", { name: "Open task", exact: true }).click()
    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
    await expect(
      page.getByRole("button", { name: "Open task", exact: true })
    ).toBeEnabled()
  })

  test(`long Mission text scrolls by wheel without moving the save controls (${width})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto(fixture)
    await page
      .getByRole("button", { name: "Open Mission", exact: true })
      .click()
    const dialog = page.getByRole("dialog", { name: "Mission", exact: true })
    const editor = dialog.locator(".ProseMirror")
    await expect(editor).toContainText("Mission paragraph 70")
    const scroller = dialog.locator(".overflow-y-auto").first()
    const bounds = await scroller.boundingBox()
    await page.mouse.move(
      bounds!.x + bounds!.width / 2,
      bounds!.y + bounds!.height / 2
    )
    await page.mouse.wheel(0, 650)
    await expect
      .poll(() => scroller.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(100)
    const before = await scroller.evaluate((element) => element.scrollTop)
    await page.mouse.wheel(0, -300)
    await expect
      .poll(() => scroller.evaluate((element) => element.scrollTop))
      .toBeLessThan(before)
    const save = dialog.getByRole("button", {
      name: "Save document",
      exact: true,
    })
    await expect(save).toBeInViewport()
    await expect(save).toBeDisabled()
    await expect(editor).toContainText("Mission paragraph 1:")
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click()
    await expect(dialog).toBeHidden()
  })
}
