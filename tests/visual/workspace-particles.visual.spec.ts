import { expect, test, type Locator, type Page } from "@playwright/test"

const ROUTE = "/visual-regression/workspace-particles"
const SUFFIX = process.platform === "linux" ? "-linux" : ""
async function open(page: Page, theme = "light") {
  await page.addInitScript(
    (value) => localStorage.setItem("theme", value),
    theme
  )
  await page.goto(ROUTE)
  await expect(
    page.getByRole("button", { name: "Add Mission to canvas", exact: true })
  ).toBeEnabled()
  await page.addStyleTag({
    content:
      "nextjs-portal, [data-testid=react-grab-overlay] { display: none !important; }",
  })
}
async function drag(page: Page, locator: Locator, x: number, y: number) {
  await locator.scrollIntoViewIfNeeded()
  const bounds = await locator.boundingBox()
  if (!bounds) throw new Error("Missing drag source")
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2
  )
  await page.mouse.down()
  await page.mouse.move(x, y, { steps: 24 })
  await page.mouse.up()
}
async function state(page: Page) {
  return JSON.parse(
    await page.locator("[data-particle-fixture-state]").innerText()
  )
}
function node(page: Page, title: string) {
  return page
    .locator(".react-flow__node-workspace-particle")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) })
}

for (const theme of ["light", "dark"]) {
  test(`particle gallery in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1200 })
    await open(page, theme)
    await expect(
      page.locator('[data-particle-return-target="library"]')
    ).toHaveScreenshot(`particles-gallery-${theme}${SUFFIX}.png`, {
      animations: "disabled",
    })
  })
}

test("linked sections drag, resize, refresh, move by keyboard, reload and return", async ({
  page,
}) => {
  await open(page)
  await drag(
    page,
    page.locator('[data-particle-source="roadmap:mission"]').last(),
    600,
    260
  )
  const mission = node(page, "Mission")
  await expect(mission).toContainText("Help neighbors")
  await mission.locator(".workspace-card-drag-handle").click()
  for (const size of ["Large", "Icon", "Mini"]) {
    await page.getByRole("radio", { name: size, exact: true }).click()
    await expect(mission.locator("[data-particle-size]")).toHaveAttribute(
      "data-particle-size",
      size.toLowerCase()
    )
  }
  await page.getByRole("button", { name: "Update linked section" }).click()
  await expect(mission).toContainText(
    "Updated mission from the original section."
  )
  const before = (await state(page)).items[0].x
  await mission.focus()
  await page.keyboard.press("ArrowRight")
  await expect
    .poll(async () => (await state(page)).items[0].x)
    .toBeGreaterThan(before)
  const saved = await state(page)
  await page.reload()
  await expect(mission).toBeVisible()
  expect((await state(page)).items).toEqual(saved.items)
  await drag(
    page,
    page.locator('aside [data-particle-source="roadmap:mission"]'),
    650,
    280
  )
  await expect(
    page.locator(".react-flow__node-workspace-particle")
  ).toHaveCount(1)
  const target = await page
    .getByRole("button", { name: "Particles", exact: true })
    .boundingBox()
  await drag(
    page,
    mission.locator(".workspace-card-drag-handle"),
    target!.x + 20,
    target!.y + 15
  )
  await expect(mission).toHaveCount(0)
  await page.getByRole("button", { name: "Particles", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Add Mission to canvas", exact: true })
  ).toBeEnabled()
})

test("Drive edits open the provider file in a new tab; viewers cannot mutate", async ({
  page,
}) => {
  await open(page)
  await page
    .getByRole("button", { name: "Add Training plan to canvas" })
    .click()
  const document = node(page, "Training plan")
  await document.locator(".workspace-card-drag-handle").click()
  const edit = page.getByRole("link", {
    name: "Edit Training plan in Google (new tab)",
  })
  await expect(edit).toHaveAttribute(
    "href",
    "https://docs.google.com/document/d/google-file-123/edit"
  )
  await expect(edit).toHaveAttribute("target", "_blank")
  await expect(edit).toHaveAttribute("rel", "noopener noreferrer")
  await page.getByRole("button", { name: "View only", exact: true }).click()
  const before = await state(page)
  await document.focus()
  await page.keyboard.press("Delete")
  await page.keyboard.press("ArrowRight")
  expect(await state(page)).toEqual(before)
  await expect(
    page.getByRole("button", { name: "Add Mission to canvas", exact: true })
  ).toBeDisabled()
})

test("private images retain their original appearance in all sizes", async ({
  page,
}) => {
  const id = "00000000-0000-0000-0000-000000000002"
  await page.addInitScript(
    (imageId) =>
      localStorage.setItem(
        "visual-fixture-particles-v1",
        JSON.stringify({
          version: 1,
          items: [],
          connections: [],
          updatedAt: "2026-09-16T00:00:00Z",
          images: [
            {
              id: imageId,
              title: "Flowers",
              path: `00000000-0000-0000-0000-000000000001/particles/${imageId}.webp`,
            },
          ],
        })
      ),
    id
  )
  await page.route("**/api/workspace/particles/images?*", (route) =>
    route.fulfill({
      path: "public/textures/fluted-glass-flowers.webp",
      contentType: "image/webp",
    })
  )
  await open(page)
  await page.getByRole("radio", { name: "Images", exact: true }).click()
  await page.getByRole("button", { name: "Add Flowers to canvas" }).click()
  const imageNode = node(page, "Flowers")
  await imageNode.locator(".workspace-card-drag-handle").click()
  for (const size of ["Mini", "Large", "Icon"]) {
    await page.getByRole("radio", { name: size, exact: true }).click()
    await expect(imageNode.locator("[data-particle-size]")).toHaveAttribute(
      "data-particle-size",
      size.toLowerCase()
    )
    if (size !== "Icon") {
      const image = imageNode.getByRole("img", { name: "Flowers" })
      await expect
        .poll(() =>
          image.evaluate(
            (element) => (element as HTMLImageElement).naturalWidth
          )
        )
        .toBeGreaterThan(0)
      await expect(image).toHaveCSS("filter", "none")
      await expect(image).toHaveCSS("object-fit", "contain")
      await expect(imageNode).toHaveScreenshot(
        `particle-image-${size.toLowerCase()}${SUFFIX}.png`,
        { animations: "disabled" }
      )
    }
  }
})
