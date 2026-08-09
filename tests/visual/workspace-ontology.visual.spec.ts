import { expect, test, type Locator, type Page } from "@playwright/test"

const FIXTURE_ROUTE = "/visual-regression/workspace-ontology"
const FOCUS_ORGANIZATION_PATH = `${FIXTURE_ROUTE}?workspace-details=organization-overview`
const FOCUS_ACCELERATOR_PATH = `${FIXTURE_ROUTE}?workspace-details=accelerator`
const MAP_PATH = `${FIXTURE_ROUTE}?workspace-view=map&workspace-details=organization-overview`

async function setThemeBeforeNavigation(page: Page, theme: "light" | "dark") {
  await page.emulateMedia({ colorScheme: theme })
  await page.addInitScript((themePreference) => {
    window.localStorage.setItem("theme", themePreference)
  }, theme)
}

async function stabilize(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }

      [data-testid="react-grab-overlay"] {
        display: none !important;
      }
    `,
  })
  await page.waitForTimeout(100)
}

function board(page: Page) {
  return page.locator('[data-workspace-ontology-board-visual-fixture="true"]')
}

async function waitForStableScene(fixture: Locator, nodeCount: number) {
  await expect(fixture).toBeVisible()
  await expect(fixture).toHaveAttribute("data-layout-animating", "false")
  await expect(fixture.locator(".react-flow__node")).toHaveCount(nodeCount)
}

async function readRootTransforms(fixture: Locator) {
  return fixture
    .locator(
      '.react-flow__node[data-id="organization-overview"], .react-flow__node[data-id="accelerator"]'
    )
    .evaluateAll((elements) =>
      elements.map((element) => ({
        id: element.getAttribute("data-id"),
        transform: (element as HTMLElement).style.transform,
      }))
    )
}

async function expectCanvasColor(
  fixture: Locator,
  expected: [number, number, number]
) {
  await expect
    .poll(() =>
      fixture.evaluate((element) => {
        const canvas = document.createElement("canvas")
        canvas.width = 1
        canvas.height = 1
        const context = canvas.getContext("2d")
        if (!context) return []
        context.fillStyle = getComputedStyle(element).backgroundColor
        context.fillRect(0, 0, 1, 1)
        return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)]
      })
    )
    .toEqual(expected)
}

async function expectNoNodeOverlaps(fixture: Locator) {
  const overlaps = await fixture
    .locator(".react-flow__node")
    .evaluateAll((elements) => {
      const boxes = elements.map((element) => ({
        id: element.getAttribute("data-id"),
        bounds: element.getBoundingClientRect(),
      }))
      return boxes.flatMap((left, leftIndex) =>
        boxes.slice(leftIndex + 1).flatMap((right) => {
          const separated =
            left.bounds.right <= right.bounds.left + 1 ||
            right.bounds.right <= left.bounds.left + 1 ||
            left.bounds.bottom <= right.bounds.top + 1 ||
            right.bounds.bottom <= left.bounds.top + 1
          return separated ? [] : [[left.id, right.id]]
        })
      )
    })
  expect(overlaps).toEqual([])
}

test("node variants remain contained on the exact light canvas", async ({
  page,
}) => {
  await setThemeBeforeNavigation(page, "light")
  await page.goto(FOCUS_ORGANIZATION_PATH)
  await stabilize(page)
  const fixture = page.locator(
    '[data-workspace-ontology-visual-fixture="true"]'
  )
  await expectCanvasColor(fixture, [252, 252, 252])
  const surfaces = fixture.locator('[data-workspace-node-part="surface"]')
  await expect(surfaces).toHaveCount(4)
  const violations = await surfaces.evaluateAll((elements) =>
    elements.flatMap((element, surfaceIndex) => {
      const surface = element.getBoundingClientRect()
      return Array.from(element.children).flatMap((child, childIndex) => {
        const bounds = child.getBoundingClientRect()
        const contained =
          bounds.left >= surface.left - 1 &&
          bounds.top >= surface.top - 1 &&
          bounds.right <= surface.right + 1 &&
          bounds.bottom <= surface.bottom + 1
        return contained ? [] : [{ surfaceIndex, childIndex }]
      })
    })
  )
  expect(violations).toEqual([])
  await expect(fixture).toHaveScreenshot("workspace-ontology-nodes.png", {
    animations: "disabled",
    scale: "css",
    maxDiffPixelRatio: 0.01,
  })
})

test("node variants remain opaque on the exact dark canvas", async ({
  page,
}) => {
  await setThemeBeforeNavigation(page, "dark")
  await page.goto(FOCUS_ORGANIZATION_PATH)
  await stabilize(page)
  const fixture = page.locator(
    '[data-workspace-ontology-visual-fixture="true"]'
  )
  await expectCanvasColor(fixture, [39, 39, 42])
  const action = fixture
    .locator('[data-workspace-ontology-node] [data-slot="button"]')
    .first()
  expect(
    await action.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    )
  ).not.toContain("/")
  await expect(fixture).toHaveScreenshot("workspace-ontology-nodes-dark.png", {
    animations: "disabled",
    scale: "css",
    maxDiffPixelRatio: 0.01,
  })
})

test("Focus collapses prioritized work into one compact list", async ({
  page,
}) => {
  await setThemeBeforeNavigation(page, "light")
  await page.goto(FOCUS_ACCELERATOR_PATH)
  await stabilize(page)
  const fixture = board(page)
  await waitForStableScene(fixture, 3)
  await expectCanvasColor(fixture, [252, 252, 252])
  await expect(
    fixture.locator('[data-workspace-ontology-mode="focus"]')
  ).toHaveAttribute("aria-pressed", "true")
  await expect(
    fixture.locator(
      '[data-workspace-ontology-node][data-workspace-ontology-presentation="action"]'
    )
  ).toHaveCount(0)
  await expect(
    fixture.locator(
      '[data-workspace-ontology-node][data-workspace-ontology-presentation="list"]'
    )
  ).toHaveCount(1)
  await expect(
    fixture.locator(
      "[data-workspace-ontology-list-item]:not([data-workspace-ontology-list-summary])"
    )
  ).toHaveCount(3)
  await expect(
    fixture.locator('[data-workspace-ontology-list-summary="more"]')
  ).toHaveCount(1)
  await expect(
    fixture.locator(
      '.workspace-ontology-edge-presence[data-workspace-ontology-active="true"]:has(path)'
    )
  ).toHaveCount(1)
  await expect(
    fixture.locator(
      '.react-flow__node[data-id="organization-overview"].workspace-ontology-dimmed-root'
    )
  ).toHaveCount(1)

  const xCoordinates = await fixture
    .locator('.react-flow__node[data-id^="ontology:"]')
    .evaluateAll((elements) =>
      elements.map((element) =>
        Math.round(element.getBoundingClientRect().left)
      )
    )
  expect(new Set(xCoordinates).size).toBe(1)
  await expectNoNodeOverlaps(fixture)
  await expect(fixture).toHaveScreenshot("workspace-ontology-focus.png", {
    animations: "disabled",
    scale: "css",
    maxDiffPixelRatio: 0.01,
  })
})

test("Map reveals the complete hierarchy without moving primary cards", async ({
  page,
}) => {
  await setThemeBeforeNavigation(page, "light")
  await page.goto(MAP_PATH)
  await stabilize(page)
  const fixture = board(page)
  await waitForStableScene(fixture, 11)
  const rootTransforms = await readRootTransforms(fixture)
  await expect(
    fixture.locator('[data-workspace-ontology-mode="map"]')
  ).toHaveAttribute("aria-pressed", "true")
  await expect(fixture.locator(".workspace-ontology-dimmed-root")).toHaveCount(
    0
  )
  await expect(
    fixture.locator(
      '[data-workspace-ontology-node][data-workspace-ontology-presentation="more"], [data-workspace-ontology-node][data-workspace-ontology-presentation="rollup"]'
    )
  ).toHaveCount(0)

  const xByDepth = await fixture
    .locator("[data-workspace-ontology-node]")
    .evaluateAll((elements) => {
      const values = new Map<string, Set<number>>()
      for (const element of elements) {
        const depth =
          element.getAttribute("data-workspace-ontology-depth") ?? ""
        const root = element.getAttribute("data-workspace-ontology-root") ?? ""
        const node = element.closest(".react-flow__node")
        const x = Math.round(node?.getBoundingClientRect().left ?? 0)
        const key = `${root}:${depth}`
        values.set(key, new Set([...(values.get(key) ?? []), x]))
      }
      return [...values.values()].map((entries) => [...entries])
    })
  expect(xByDepth.every((entries) => entries.length === 1)).toBe(true)
  await expectNoNodeOverlaps(fixture)
  await expect(fixture).toHaveScreenshot("workspace-ontology-map.png", {
    animations: "disabled",
    scale: "css",
    maxDiffPixelRatio: 0.01,
  })

  await fixture
    .locator(
      '.react-flow__node[data-id="ontology:visual:mission"] [data-slot="button"]'
    )
    .click()
  await waitForStableScene(fixture, 4)
  await expect(page).not.toHaveURL(/workspace-view=map/)
  await expect(page).toHaveURL(/workspace-groups=ontology%3Avisual%3Amission/)
  expect(await readRootTransforms(fixture)).toEqual(rootTransforms)
})

test("a nested group dims siblings and Escape restores its parent", async ({
  page,
}) => {
  await setThemeBeforeNavigation(page, "light")
  await page.goto(FOCUS_ORGANIZATION_PATH)
  await stabilize(page)
  const fixture = board(page)
  await waitForStableScene(fixture, 3)
  const mission = fixture.locator(
    '[data-workspace-ontology-list-item="ontology:visual:mission"]'
  )
  await mission.click()
  await waitForStableScene(fixture, 4)
  await expect(page).toHaveURL(/workspace-groups=ontology%3Avisual%3Amission/)
  await expect(mission).toHaveAttribute("aria-current", "step")
  await expect(
    fixture.locator(
      '[data-workspace-ontology-list-item="ontology:visual:board"]'
    )
  ).toHaveAttribute("data-workspace-ontology-list-item-dimmed", "true")
  await expect(
    fixture.locator('[data-workspace-ontology-list-summary="rollup"]')
  ).toHaveCount(1)

  await page.keyboard.press("Escape")
  await waitForStableScene(fixture, 3)
  await expect(page).not.toHaveURL(/workspace-groups=/)
  await expect(
    fixture.locator('.react-flow__node[data-id="organization-overview"]')
  ).toBeFocused()
})

test("Back and Forward restore the active root", async ({ page }) => {
  await setThemeBeforeNavigation(page, "light")
  await page.goto(FOCUS_ORGANIZATION_PATH)
  await stabilize(page)
  const fixture = board(page)
  await waitForStableScene(fixture, 3)
  await fixture
    .locator(
      '.react-flow__node[data-id="accelerator"] [data-workspace-ontology-branch-toggle="true"]'
    )
    .click()
  await waitForStableScene(fixture, 3)
  await expect(page).toHaveURL(/workspace-details=accelerator/)

  await page.goBack()
  await waitForStableScene(fixture, 3)
  await expect(page).toHaveURL(/workspace-details=organization-overview/)
  await page.goForward()
  await waitForStableScene(fixture, 3)
  await expect(page).toHaveURL(/workspace-details=accelerator/)
})

test("reduced motion keeps mobile Focus readable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await setThemeBeforeNavigation(page, "light")
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto(FOCUS_ACCELERATOR_PATH)
  const fixture = board(page)
  await fixture.scrollIntoViewIfNeeded()
  await waitForStableScene(fixture, 3)
  await expect
    .poll(async () => Number(await fixture.getAttribute("data-viewport-zoom")))
    .toBeGreaterThanOrEqual(0.85)
  await expect
    .poll(() =>
      fixture
        .locator("[data-workspace-ontology-node]")
        .first()
        .evaluate((element) => getComputedStyle(element).transitionDuration)
    )
    .toBe("0s")
})

test("complete Map remains legible on the dark canvas", async ({ page }) => {
  await setThemeBeforeNavigation(page, "dark")
  await page.goto(MAP_PATH)
  await stabilize(page)
  const fixture = board(page)
  await waitForStableScene(fixture, 11)
  await expectCanvasColor(fixture, [39, 39, 42])
  await expect(fixture).toHaveScreenshot("workspace-ontology-map-dark.png", {
    animations: "disabled",
    scale: "css",
    maxDiffPixelRatio: 0.01,
  })
})
