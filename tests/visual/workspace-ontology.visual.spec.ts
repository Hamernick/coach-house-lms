import { expect, test, type Page } from "@playwright/test"

const WORKSPACE_ONTOLOGY_FIXTURE_PATH =
  "/visual-regression/workspace-ontology?workspace-details=organization-overview%2Caccelerator"
const WORKSPACE_ONTOLOGY_COLLAPSED_FIXTURE_PATH =
  "/visual-regression/workspace-ontology"

async function stabilizeForScreenshot(page: Page) {
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

async function setThemeBeforeNavigation(page: Page, theme: "light" | "dark") {
  await page.emulateMedia({ colorScheme: theme })
  await page.addInitScript((themePreference) => {
    window.localStorage.setItem("theme", themePreference)
  }, theme)
}

async function expectContainedNodeContent(page: Page) {
  const surfaces = page
    .locator('[data-workspace-ontology-visual-fixture="true"]')
    .locator('[data-workspace-node-part="surface"]')
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
}

async function expectNoFloatingOntologyPanel(page: Page) {
  const fixture = page.locator(
    '[data-workspace-ontology-visual-fixture="true"]'
  )
  await expect(
    fixture.locator(
      '[data-workspace-ontology-controls="true"], [data-workspace-ontology-panel-anchor]'
    )
  ).toHaveCount(0)
}

async function expectCardFirstOntologyActions(page: Page) {
  const fixture = page.locator(
    '[data-workspace-ontology-visual-fixture="true"]'
  )
  await expect(fixture.locator(".react-flow__node-toolbar")).toHaveCount(0)
  await expect(
    fixture.locator('[data-workspace-ontology-primary-action="open"]')
  ).toHaveCount(3)
  await expect(
    fixture.locator('[data-workspace-ontology-primary-action="show-details"]')
  ).toHaveCount(1)
  await expect(
    fixture.locator('[data-workspace-ontology-primary-action="open"] a')
  ).toHaveCount(3)
  await expect(
    fixture.locator(
      '[data-workspace-ontology-primary-action="show-details"] button'
    )
  ).toHaveCount(1)
}

async function expectOpaqueOntologyNodeHover(page: Page) {
  const frame = page
    .locator('[data-workspace-ontology-visual-fixture="true"]')
    .locator('[data-workspace-node-part="root"]')
    .first()
  await frame.hover()
  const backgroundColor = await frame.evaluate(
    (element) => getComputedStyle(element).backgroundColor
  )
  expect(backgroundColor).not.toContain("/")
}

async function expectDarkOntologyActionToStayOpaque(page: Page) {
  const action = page
    .locator('[data-workspace-ontology-visual-fixture="true"]')
    .locator('[data-workspace-ontology-node] [data-slot="button"]')
    .first()
  const colors = await action.evaluate((element) => {
    const frame = element.closest<HTMLElement>(
      '[data-workspace-node-part="root"]'
    )
    const actionBackground = getComputedStyle(element).backgroundColor
    const frameBackground = frame ? getComputedStyle(frame).backgroundColor : ""
    const perceivedLightness = (color: string) => {
      const [red = 0, green = 0, blue = 0] =
        color
          .match(/[\d.]+/g)
          ?.slice(0, 3)
          .map(Number) ?? []
      return red * 0.2126 + green * 0.7152 + blue * 0.0722
    }
    return {
      actionBackground,
      actionLightness: perceivedLightness(actionBackground),
      frameLightness: perceivedLightness(frameBackground),
    }
  })

  expect(colors.actionBackground).not.toContain("/")
  expect(colors.actionLightness).toBeLessThan(colors.frameLightness)
}

async function expectRootBranchControlsOutsideCards(page: Page) {
  const fixture = page.locator(
    '[data-workspace-ontology-board-visual-fixture="true"]'
  )
  for (const rootId of ["organization-overview", "accelerator"]) {
    const rootNode = fixture.locator(`.react-flow__node[data-id="${rootId}"]`)
    const card = rootNode.locator('[data-workspace-node-part="root"]')
    const control = rootNode.locator(
      '[data-workspace-ontology-branch-toggle="true"]'
    )
    const [rootNodeBox, cardBox, controlBox] = await Promise.all([
      rootNode.boundingBox(),
      card.boundingBox(),
      control.boundingBox(),
    ])
    expect(rootNodeBox).not.toBeNull()
    expect(cardBox).not.toBeNull()
    expect(controlBox).not.toBeNull()
    if (!rootNodeBox || !cardBox || !controlBox) continue
    expect(controlBox.y).toBeGreaterThanOrEqual(cardBox.y + cardBox.height + 6)
    expect(controlBox.y + controlBox.height).toBeLessThanOrEqual(
      rootNodeBox.y + rootNodeBox.height + 1
    )
  }
}

async function expectRelationshipLabelsInClearCorridors(page: Page) {
  const fixture = page.locator(
    '[data-workspace-ontology-board-visual-fixture="true"]'
  )
  const labels = fixture.locator('[data-workspace-ontology-edge-label="true"]')
  await expect(labels).toHaveCount(3)
  const collisions = await labels.evaluateAll((elements) => {
    const protectedElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-workspace-ontology-board-visual-fixture="true"] .react-flow__node, [data-workspace-ontology-board-visual-fixture="true"] [data-workspace-ontology-branch-toggle="true"]'
      )
    )
    return elements.flatMap((element, labelIndex) => {
      const label = element.getBoundingClientRect()
      return protectedElements.flatMap((protectedElement) => {
        const protectedBounds = protectedElement.getBoundingClientRect()
        const separated =
          label.right <= protectedBounds.left + 1 ||
          protectedBounds.right <= label.left + 1 ||
          label.bottom <= protectedBounds.top + 1 ||
          protectedBounds.bottom <= label.top + 1
        return separated
          ? []
          : [
              {
                labelIndex,
                protectedId:
                  protectedElement
                    .closest(".react-flow__node")
                    ?.getAttribute("data-id") ?? "branch-toggle",
              },
            ]
      })
    })
  })
  expect(collisions).toEqual([])
}

async function expectPrimaryRootScenesOrderedHorizontally(page: Page) {
  const fixture = page.locator(
    '[data-workspace-ontology-board-visual-fixture="true"]'
  )
  await expect
    .poll(async () => {
      const [organization, accelerator] = await Promise.all([
        fixture
          .locator('.react-flow__node[data-id="organization-overview"]')
          .boundingBox(),
        fixture
          .locator('.react-flow__node[data-id="accelerator"]')
          .boundingBox(),
      ])
      return Boolean(
        organization &&
        accelerator &&
        accelerator.x >= organization.x + organization.width
      )
    })
    .toBe(true)
  await expect(fixture).toHaveAttribute("data-layout-animating", "false")
}

test("ontology nodes contain dense content", async ({ page }) => {
  await setThemeBeforeNavigation(page, "light")
  await page.goto(WORKSPACE_ONTOLOGY_FIXTURE_PATH)
  const fixture = page.locator(
    '[data-workspace-ontology-visual-fixture="true"]'
  )
  await expect(fixture).toBeVisible()
  await stabilizeForScreenshot(page)
  await expectContainedNodeContent(page)
  await expectNoFloatingOntologyPanel(page)
  await expectCardFirstOntologyActions(page)
  await expect(fixture).toHaveScreenshot("workspace-ontology-nodes.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
    maxDiffPixelRatio: 0.01,
  })
  await expectOpaqueOntologyNodeHover(page)
})

test("ontology nodes contain dense content in dark mode", async ({ page }) => {
  await setThemeBeforeNavigation(page, "dark")
  await page.goto(WORKSPACE_ONTOLOGY_FIXTURE_PATH)
  const fixture = page.locator(
    '[data-workspace-ontology-visual-fixture="true"]'
  )
  await expect(fixture).toBeVisible()
  await stabilizeForScreenshot(page)
  await expectContainedNodeContent(page)
  await expectNoFloatingOntologyPanel(page)
  await expectCardFirstOntologyActions(page)
  await expectDarkOntologyActionToStayOpaque(page)
  await expect(fixture).toHaveScreenshot("workspace-ontology-nodes-dark.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
    maxDiffPixelRatio: 0.01,
  })
  await expectOpaqueOntologyNodeHover(page)
})

test("expanded primary cards and details share one non-overlapping scene", async ({
  page,
}) => {
  await setThemeBeforeNavigation(page, "light")
  await page.goto(WORKSPACE_ONTOLOGY_FIXTURE_PATH)
  const fixture = page.locator(
    '[data-workspace-ontology-board-visual-fixture="true"]'
  )
  await expect(fixture).toBeVisible()
  await expect(fixture.locator(".react-flow__node")).toHaveCount(8)
  await expect(fixture).toHaveAttribute("data-layout-animating", "false")
  await expect(fixture.locator(".react-flow__edge[tabindex]")).toHaveCount(0)
  await expect(
    fixture.locator('.react-flow__node[data-id="ontology:visual:mission"]')
  ).toHaveAttribute("aria-expanded", "false")
  await stabilizeForScreenshot(page)
  await expectPrimaryRootScenesOrderedHorizontally(page)
  await expectRootBranchControlsOutsideCards(page)
  await expectRelationshipLabelsInClearCorridors(page)

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
  const horizontalBranchViolations = await fixture
    .locator(".react-flow__node")
    .evaluateAll((elements) => {
      const byId = new Map(
        elements.map((element) => [
          element.getAttribute("data-id"),
          element.getBoundingClientRect(),
        ])
      )
      const branches = [
        {
          rootId: "organization-overview",
          childIds: [
            "ontology:visual:mission",
            "ontology:visual:board",
            "ontology:visual:program",
          ],
        },
        {
          rootId: "accelerator",
          childIds: [
            "ontology:visual:legal",
            "ontology:visual:budget",
            "ontology:visual:launch",
          ],
        },
      ]
      return branches.flatMap(({ rootId, childIds }) => {
        const root = byId.get(rootId)
        if (!root) return [`missing:${rootId}`]
        return childIds.filter((childId) => {
          const child = byId.get(childId)
          return !child || child.left <= root.right
        })
      })
    })
  expect(horizontalBranchViolations).toEqual([])
  await expect(
    fixture.locator('[data-workspace-ontology-node] [class*="rounded-r-full"]')
  ).toHaveCount(0)
  await expect(fixture).toHaveScreenshot("workspace-ontology-board.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
    maxDiffPixelRatio: 0.01,
  })
})

test("branch reveal and collapse keep nodes and edges in one transition", async ({
  page,
}) => {
  await setThemeBeforeNavigation(page, "light")
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.goto(WORKSPACE_ONTOLOGY_FIXTURE_PATH)
  const fixture = page.locator(
    '[data-workspace-ontology-board-visual-fixture="true"]'
  )
  await expect(fixture).toHaveAttribute("data-layout-animating", "false")
  await expect(fixture.locator(".react-flow__node")).toHaveCount(8)
  const rootTransforms = await fixture
    .locator(
      '.react-flow__node[data-id="organization-overview"], .react-flow__node[data-id="accelerator"]'
    )
    .evaluateAll((elements) =>
      elements.map((element) => (element as HTMLElement).style.transform)
    )
  await fixture.evaluate((element) => {
    const record = {
      exitingNodeIds: new Set<string>(),
      maxNodeCount: element.querySelectorAll(".react-flow__node").length,
    }
    const observer = new MutationObserver(() => {
      record.maxNodeCount = Math.max(
        record.maxNodeCount,
        element.querySelectorAll(".react-flow__node").length
      )
      element
        .querySelectorAll('.react-flow__node [data-transition-phase="exiting"]')
        .forEach((node) => {
          const nodeId = node
            .closest(".react-flow__node")
            ?.getAttribute("data-id")
          if (nodeId) record.exitingNodeIds.add(nodeId)
        })
    })
    observer.observe(element, {
      attributes: true,
      attributeFilter: ["data-transition-phase"],
      childList: true,
      subtree: true,
    })
    Object.assign(window, {
      __workspaceOntologyTransitionRecord: { observer, record },
    })
  })

  await fixture
    .locator(
      '.react-flow__node[data-id="organization-overview"] [data-workspace-ontology-branch-toggle="true"]'
    )
    .click()
  await expect(fixture.locator(".react-flow__node")).toHaveCount(5)
  await expect(fixture).toHaveAttribute("data-layout-animating", "false")
  await expect
    .poll(() =>
      fixture
        .locator(
          '.react-flow__node[data-id="organization-overview"], .react-flow__node[data-id="accelerator"]'
        )
        .evaluateAll((elements) =>
          elements.map((element) => (element as HTMLElement).style.transform)
        )
    )
    .toEqual(rootTransforms)
  const collapseTransition = await fixture.evaluate(() => {
    const transition = (
      window as typeof window & {
        __workspaceOntologyTransitionRecord?: {
          observer: MutationObserver
          record: {
            exitingNodeIds: Set<string>
            maxNodeCount: number
          }
        }
      }
    ).__workspaceOntologyTransitionRecord
    transition?.observer.disconnect()
    return {
      exitingNodeIds: Array.from(transition?.record.exitingNodeIds ?? []),
      maxNodeCount: transition?.record.maxNodeCount ?? 0,
    }
  })
  expect(collapseTransition.maxNodeCount).toBe(8)
  expect(collapseTransition.exitingNodeIds).toHaveLength(3)

  await fixture
    .locator(
      '.react-flow__node[data-id="organization-overview"] [data-workspace-ontology-branch-toggle="true"]'
    )
    .click()
  await expect
    .poll(() => fixture.locator('[data-transition-phase="entering"]').count(), {
      timeout: 1_000,
      intervals: [10, 20, 30],
    })
    .toBeGreaterThan(0)
  const enteringNodeDelays = await fixture
    .locator(
      '.react-flow__node[data-id^="ontology:"] [data-transition-phase="entering"]'
    )
    .evaluateAll((elements) =>
      elements.map((element) =>
        Number(element.getAttribute("data-transition-delay-ms"))
      )
    )
  expect(new Set(enteringNodeDelays).size).toBeGreaterThan(1)
  await expect(fixture).toHaveAttribute("data-layout-animating", "false")
  await expect(fixture.locator(".react-flow__node")).toHaveCount(8)
})

test("root branch controls support Space without canvas interference", async ({
  page,
}) => {
  await setThemeBeforeNavigation(page, "light")
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto(WORKSPACE_ONTOLOGY_FIXTURE_PATH)
  const fixture = page.locator(
    '[data-workspace-ontology-board-visual-fixture="true"]'
  )
  const toggle = fixture.locator(
    '.react-flow__node[data-id="organization-overview"] [data-workspace-ontology-branch-toggle="true"]'
  )

  await toggle.focus()
  await page.keyboard.press("Space")
  await expect(fixture.locator(".react-flow__node")).toHaveCount(5)
  await expect(toggle).toHaveAttribute("aria-expanded", "false")
  await page.keyboard.press("Space")
  await expect(fixture.locator(".react-flow__node")).toHaveCount(8)
  await expect(toggle).toHaveAttribute("aria-expanded", "true")
})

test("browser history restores personal branch expansion", async ({ page }) => {
  await setThemeBeforeNavigation(page, "light")
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto(WORKSPACE_ONTOLOGY_FIXTURE_PATH)
  const fixture = page.locator(
    '[data-workspace-ontology-board-visual-fixture="true"]'
  )
  const toggle = fixture.locator(
    '.react-flow__node[data-id="organization-overview"] [data-workspace-ontology-branch-toggle="true"]'
  )

  await expect(fixture.locator(".react-flow__node")).toHaveCount(8)
  await toggle.click()
  await expect(fixture.locator(".react-flow__node")).toHaveCount(5)
  await expect(page).toHaveURL(/workspace-details=accelerator/)
  await page.goBack()
  await expect(fixture.locator(".react-flow__node")).toHaveCount(8)
  await expect(page).toHaveURL(/organization-overview/)
})

test("a first-time user can identify and open the next blocked action", async ({
  page,
}) => {
  await setThemeBeforeNavigation(page, "light")
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto(WORKSPACE_ONTOLOGY_COLLAPSED_FIXTURE_PATH)
  const fixture = page.locator(
    '[data-workspace-ontology-board-visual-fixture="true"]'
  )
  const acceleratorToggle = fixture.locator(
    '.react-flow__node[data-id="accelerator"] [data-workspace-ontology-branch-toggle="true"]'
  )

  await expect(acceleratorToggle).toContainText("Start setup")
  await expect(
    acceleratorToggle.locator('[data-workspace-ontology-branch-count="true"]')
  ).toHaveText("2")
  await acceleratorToggle.click()
  await expect(fixture.locator(".react-flow__node")).toHaveCount(5)

  const priorityOrder = await fixture
    .locator(
      '.react-flow__node[data-id="ontology:visual:legal"], .react-flow__node[data-id="ontology:visual:launch"], .react-flow__node[data-id="ontology:visual:budget"]'
    )
    .evaluateAll((elements) =>
      elements
        .map((element) => ({
          id: element.getAttribute("data-id"),
          top: element.getBoundingClientRect().top,
        }))
        .sort((left, right) => left.top - right.top)
        .map(({ id }) => id)
    )
  expect(priorityOrder).toEqual([
    "ontology:visual:legal",
    "ontology:visual:launch",
    "ontology:visual:budget",
  ])
  const firstPriority = fixture.locator(
    '.react-flow__node[data-id="ontology:visual:legal"]'
  )
  await expect(firstPriority).toContainText("Blocked")
  await expect(firstPriority).toContainText("Resolve blocker")
  await expect(firstPriority.locator("a")).toHaveAttribute(
    "href",
    "/workspace/accelerator"
  )
  await firstPriority.locator("a").click()
  await expect(page).toHaveURL(/\/login\?redirect=%2Fworkspace%2Faccelerator/)
})

test("rapid branch toggles restore the canonical scene", async ({ page }) => {
  await setThemeBeforeNavigation(page, "light")
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.goto(WORKSPACE_ONTOLOGY_FIXTURE_PATH)
  const fixture = page.locator(
    '[data-workspace-ontology-board-visual-fixture="true"]'
  )
  const toggle = fixture.locator(
    '.react-flow__node[data-id="organization-overview"] [data-workspace-ontology-branch-toggle="true"]'
  )
  const readScene = () =>
    fixture.evaluate((element) => ({
      viewport:
        element
          .querySelector<HTMLElement>(".react-flow__viewport")
          ?.style.getPropertyValue("transform") ?? "",
      nodes: Array.from(
        element.querySelectorAll<HTMLElement>(".react-flow__node")
      )
        .map((node) => ({
          id: node.getAttribute("data-id"),
          transform: node.style.transform,
        }))
        .sort((left, right) => (left.id ?? "").localeCompare(right.id ?? "")),
    }))

  await expect(fixture).toHaveAttribute("data-layout-animating", "false")
  await expect(fixture.locator(".react-flow__node")).toHaveCount(8)
  const initialScene = await readScene()

  for (let index = 0; index < 20; index += 1) {
    await toggle.click()
    await page.waitForTimeout(20)
  }

  await expect(fixture).toHaveAttribute("data-layout-animating", "false")
  await expect(fixture.locator(".react-flow__node")).toHaveCount(8)
  await expect.poll(readScene, { timeout: 2_000 }).toEqual(initialScene)

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
})

test("nested details reopen at identical horizontal coordinates", async ({
  page,
}) => {
  await setThemeBeforeNavigation(page, "light")
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto(WORKSPACE_ONTOLOGY_FIXTURE_PATH)
  const fixture = page.locator(
    '[data-workspace-ontology-board-visual-fixture="true"]'
  )
  const group = fixture.locator(
    '.react-flow__node[data-id="ontology:visual:mission"] [data-workspace-ontology-node] [data-slot="button"]'
  )
  await expect(fixture).toHaveAttribute("data-layout-animating", "false")
  await group.click()
  await expect(fixture.locator(".react-flow__node")).toHaveCount(10)
  await expect(fixture).toHaveAttribute("data-layout-animating", "false")

  const nestedPositions = await fixture
    .locator('.react-flow__node[data-id^="ontology:"]')
    .evaluateAll((elements) =>
      elements.map((element) => ({
        id: element.getAttribute("data-id"),
        transform: (element as HTMLElement).style.transform,
      }))
    )
  const horizontalViolations = await fixture.evaluate((element) => {
    const groupNode = element.querySelector(
      '.react-flow__node[data-id="ontology:visual:mission"]'
    )
    const groupBounds = groupNode?.getBoundingClientRect()
    if (!groupBounds) return ["missing-group"]
    return [
      "ontology:visual:mission:statement",
      "ontology:visual:mission:outcomes",
    ].filter((nodeId) => {
      const child = element.querySelector(
        `.react-flow__node[data-id="${nodeId}"]`
      )
      return !child || child.getBoundingClientRect().left <= groupBounds.right
    })
  })
  expect(horizontalViolations).toEqual([])

  await group.click()
  await expect(fixture.locator(".react-flow__node")).toHaveCount(8)
  await expect(fixture).toHaveAttribute("data-layout-animating", "false")
  await group.click()
  await expect(fixture.locator(".react-flow__node")).toHaveCount(10)
  await expect(fixture).toHaveAttribute("data-layout-animating", "false")
  await expect
    .poll(() =>
      fixture
        .locator('.react-flow__node[data-id^="ontology:"]')
        .evaluateAll((elements) =>
          elements.map((element) => ({
            id: element.getAttribute("data-id"),
            transform: (element as HTMLElement).style.transform,
          }))
        )
    )
    .toEqual(nestedPositions)
})

test("expanded horizontal scene matches the dark workspace", async ({
  page,
}) => {
  await setThemeBeforeNavigation(page, "dark")
  await page.goto(WORKSPACE_ONTOLOGY_FIXTURE_PATH)
  const fixture = page.locator(
    '[data-workspace-ontology-board-visual-fixture="true"]'
  )
  await expect(fixture).toBeVisible()
  await stabilizeForScreenshot(page)
  await expect(fixture.locator(".react-flow__node")).toHaveCount(8)
  await expectPrimaryRootScenesOrderedHorizontally(page)
  await expectRelationshipLabelsInClearCorridors(page)
  await expect(fixture).toHaveScreenshot("workspace-ontology-board-dark.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css",
    maxDiffPixelRatio: 0.01,
  })
})

test("expanded scene keeps a readable mobile focus instead of shrinking the whole graph", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await setThemeBeforeNavigation(page, "light")
  await page.goto(WORKSPACE_ONTOLOGY_COLLAPSED_FIXTURE_PATH)
  const fixture = page.locator(
    '[data-workspace-ontology-board-visual-fixture="true"]'
  )
  await fixture.scrollIntoViewIfNeeded()
  await expect(fixture).toHaveAttribute("data-layout-animating", "false")
  await fixture
    .locator(
      '.react-flow__node[data-id="accelerator"] [data-workspace-ontology-branch-toggle="true"]'
    )
    .click()
  await expect(fixture.locator(".react-flow__node")).toHaveCount(5)
  await expect
    .poll(async () => Number(await fixture.getAttribute("data-viewport-zoom")))
    .toBeGreaterThanOrEqual(0.85)

  const readMobileFocus = () =>
    fixture.evaluate((element) => {
      const canvas = element.querySelector(".react-flow") ?? element
      const fixtureBounds = canvas.getBoundingClientRect()
      const priorityAction = element.querySelector(
        '.react-flow__node[data-id="ontology:visual:legal"]'
      )
      const bounds = priorityAction?.getBoundingClientRect()
      return {
        contained: Boolean(
          bounds &&
          bounds.left >= fixtureBounds.left - 2 &&
          bounds.right <= fixtureBounds.right + 2 &&
          bounds.top >= fixtureBounds.top - 2 &&
          bounds.bottom <= fixtureBounds.bottom + 2
        ),
        width: bounds?.width ?? 0,
      }
    })
  await expect.poll(readMobileFocus).toMatchObject({ contained: true })
  await expect
    .poll(async () => (await readMobileFocus()).width)
    .toBeGreaterThanOrEqual(279)

  await page.goBack()
  await expect(fixture.locator(".react-flow__node")).toHaveCount(2)
  await expect
    .poll(() =>
      fixture.evaluate((element) => {
        const canvas = element.querySelector(".react-flow") ?? element
        const fixtureBounds = canvas.getBoundingClientRect()
        const root = element
          .querySelector('.react-flow__node[data-id="accelerator"]')
          ?.getBoundingClientRect()
        return Boolean(
          root &&
          root.left >= fixtureBounds.left - 2 &&
          root.right <= fixtureBounds.right + 2 &&
          root.top >= fixtureBounds.top - 2 &&
          root.bottom <= fixtureBounds.bottom + 2
        )
      })
    )
    .toBe(true)

  const containmentFixture = page.locator(
    '[data-workspace-ontology-visual-fixture="true"]'
  )
  await expect(
    containmentFixture.locator(".react-flow__node-toolbar")
  ).toHaveCount(0)
})
