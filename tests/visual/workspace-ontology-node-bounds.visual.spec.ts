import { expect, test, type Locator } from "@playwright/test"

const NODE_CASES = [
  { id: "visual:overview", width: 280, height: 112 },
  { id: "visual:standard", width: 280, height: 112 },
  { id: "visual:full", width: 280, height: 112 },
  { id: "visual:selected-group", width: 300, height: 112 },
] as const

async function expectInside(parent: Locator, child: Locator, label: string) {
  const [parentBox, childBox] = await Promise.all([
    parent.boundingBox(),
    child.boundingBox(),
  ])
  expect(parentBox, `${label} parent must be measurable`).not.toBeNull()
  expect(childBox, `${label} child must be measurable`).not.toBeNull()
  if (!parentBox || !childBox) return

  const tolerance = 1
  expect(childBox.x, `${label} left edge`).toBeGreaterThanOrEqual(
    parentBox.x - tolerance
  )
  expect(childBox.y, `${label} top edge`).toBeGreaterThanOrEqual(
    parentBox.y - tolerance
  )
  expect(
    childBox.x + childBox.width,
    `${label} right edge`
  ).toBeLessThanOrEqual(parentBox.x + parentBox.width + tolerance)
  expect(
    childBox.y + childBox.height,
    `${label} bottom edge`
  ).toBeLessThanOrEqual(parentBox.y + parentBox.height + tolerance)
}

test("long ontology content remains inside production node bounds", async ({
  page,
}) => {
  await page.goto(
    "/visual-regression/workspace-ontology?workspace-details=organization-overview"
  )
  const fixture = page.locator(
    '[data-workspace-ontology-visual-fixture="true"]'
  )
  await expect(fixture).toBeVisible()

  for (const nodeCase of NODE_CASES) {
    const node = fixture.locator(`.react-flow__node[data-id="${nodeCase.id}"]`)
    const root = node.locator('[data-workspace-node-part="root"]')
    const surface = root.locator('[data-workspace-node-part="surface"]')
    const header = root.locator('[data-workspace-node-part="header"]')
    const nodeSize = await node.evaluate((element) => ({
      width: (element as HTMLElement).offsetWidth,
      height: (element as HTMLElement).offsetHeight,
    }))

    expect(nodeSize.width, `${nodeCase.id} width`).toBe(nodeCase.width)
    expect(nodeSize.height, `${nodeCase.id} height`).toBe(nodeCase.height)
    await expectInside(root, surface, `${nodeCase.id} surface`)
    await expectInside(root, header, `${nodeCase.id} header`)

    const overflow = await surface.evaluate((element) => ({
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
    }))
    expect(
      overflow.scrollWidth,
      `${nodeCase.id} horizontal overflow`
    ).toBeLessThanOrEqual(overflow.clientWidth)
    expect(
      overflow.scrollHeight,
      `${nodeCase.id} vertical overflow`
    ).toBeLessThanOrEqual(overflow.clientHeight)
  }
})
