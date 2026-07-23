import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import postcss, { type AcceptedPlugin } from "postcss"
import tailwindcss from "@tailwindcss/postcss"
import { expect, test, type Locator, type Page } from "@playwright/test"

import { resolveWorkspaceOntologyNodeSize } from "../../src/features/workspace-ontology/lib/node-size"
import type {
  WorkspaceOntologyDetailLevel,
  WorkspaceOntologyProjectedNode,
} from "../../src/features/workspace-ontology/types"
import type { WorkspaceOntologyNodeData } from "../../src/features/workspace-ontology/components/workspace-ontology-node"

let WorkspaceOntologyNodeForTest: React.ComponentType<{
  data: WorkspaceOntologyNodeData
  selected: boolean
}>
let ReactFlowProviderForTest: React.ComponentType<React.PropsWithChildren>
let useReactFlowStoreApiForTest: () => {
  setState: (state: { onError: () => undefined }) => void
}

function SilenceExpectedReactFlowHandleErrors({
  children,
}: React.PropsWithChildren) {
  const store = useReactFlowStoreApiForTest()
  store.setState({ onError: () => undefined })
  return children
}

test.beforeAll(async () => {
  const { createServer } = await import("vite")
  const vite = await createServer({
    appType: "custom",
    configFile: false,
    resolve: {
      alias: {
        "@": `${process.cwd()}/src`,
      },
    },
    ssr: {
      noExternal: [/^lucide-react/],
    },
    server: { middlewareMode: true },
  })
  try {
    const ontologyNodeModule = await vite.ssrLoadModule(
      "/src/features/workspace-ontology/components/workspace-ontology-node.tsx"
    )
    const reactFlowModule = await vite.ssrLoadModule("reactflow")
    WorkspaceOntologyNodeForTest = ontologyNodeModule.WorkspaceOntologyNode
    ReactFlowProviderForTest = reactFlowModule.ReactFlowProvider
    useReactFlowStoreApiForTest = reactFlowModule.useStoreApi
  } finally {
    await vite.close()
  }
})

const LONG_LABEL =
  "Community-centered organizational readiness, governance, compliance, fundraising, program delivery, and longitudinal impact measurement"
const LONG_STATUS =
  "Missing several required approvals, supporting documents, ownership assignments, and scheduled follow-up decisions"
const LONG_OWNER =
  "Executive Director, board governance committee, fiscal sponsor review team, program operations leads, and external advisors"

function buildNode({
  hasChildren,
}: {
  hasChildren: boolean
}): WorkspaceOntologyProjectedNode {
  return {
    id: hasChildren ? "ontology:dense:group" : "ontology:dense:leaf",
    label: LONG_LABEL,
    description: LONG_LABEL,
    category: "organization",
    kind: "Dense organization requirement with extended metadata",
    status: "missing",
    statusLabel: LONG_STATUS,
    relationshipLabel: "requires",
    href: "/workspace?view=editor&tab=company",
    actionLabel: "Complete requirement",
    ownerLabel: LONG_OWNER,
    rootId: "organization-overview",
    parentId: "organization-overview",
    depth: 1,
    childCount: hasChildren ? 999 : 0,
    hasChildren,
  }
}

function renderNodeCase({
  detailLevel,
  hasChildren,
}: {
  detailLevel: WorkspaceOntologyDetailLevel
  hasChildren: boolean
}) {
  const node = buildNode({ hasChildren })
  const size = resolveWorkspaceOntologyNodeSize(node)
  const data: WorkspaceOntologyNodeData = {
    kind: "workspace-ontology",
    node,
    detailLevel,
    expanded: true,
  }
  const caseId = `${detailLevel}-${hasChildren ? "group" : "leaf"}`
  const nodeProps = {
    id: node.id,
    data,
    selected: false,
    dragging: false,
    isConnectable: false,
    type: "workspace-ontology",
    zIndex: 0,
    xPos: 0,
    yPos: 0,
  }

  return React.createElement(
    "section",
    {
      key: caseId,
      "data-ontology-node-bounds-case": caseId,
      "data-expected-width": String(size.width),
      "data-expected-height": String(size.height),
      style: {
        position: "relative",
        width: `${size.width}px`,
        height: `${size.height}px`,
      },
    },
    React.createElement(
      ReactFlowProviderForTest,
      null,
      React.createElement(
        SilenceExpectedReactFlowHandleErrors,
        null,
        React.createElement(WorkspaceOntologyNodeForTest, nodeProps as never)
      )
    )
  )
}

function renderFixtureMarkup() {
  const detailLevels: WorkspaceOntologyDetailLevel[] = [
    "overview",
    "standard",
    "full",
  ]
  return renderToStaticMarkup(
    React.createElement(
      "main",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(2, max-content)",
          alignItems: "start",
          gap: "48px",
          padding: "48px",
        },
      },
      detailLevels.flatMap((detailLevel) => [
        renderNodeCase({ detailLevel, hasChildren: false }),
        renderNodeCase({ detailLevel, hasChildren: true }),
      ])
    )
  )
}

function extractClassCandidates(markup: string) {
  return Array.from(markup.matchAll(/class="([^"]+)"/g))
    .flatMap((match) => match[1].split(/\s+/))
    .filter(Boolean)
}

async function compileFixtureCss(markup: string) {
  const candidates = Array.from(new Set(extractClassCandidates(markup)))
  const source = `
    @import "tailwindcss" source(none);
    @source inline("${candidates.join(" ")}");
  `
  const result = await postcss([
    tailwindcss() as unknown as AcceptedPlugin,
  ]).process(source, {
    from: `${process.cwd()}/tests/visual/workspace-ontology-node-bounds.css`,
  })
  return result.css
}

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

async function installFixture(page: Page) {
  const markup = renderFixtureMarkup()
  const css = await compileFixtureCss(markup)
  await page.setContent(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          html, body { margin: 0; min-width: 900px; }
          .workspace-ontology-node-drag-handle {
            opacity: 1 !important;
            transform: none !important;
          }
          ${css}
        </style>
      </head>
      <body>${markup}</body>
    </html>
  `)
}

test("long ontology node content remains inside measured bounds at every detail level", async ({
  page,
}) => {
  await installFixture(page)

  const cases = page.locator("[data-ontology-node-bounds-case]")
  await expect(cases).toHaveCount(6)

  for (let index = 0; index < 6; index += 1) {
    const fixtureCase = cases.nth(index)
    const root = fixtureCase.locator('[data-workspace-node-part="root"]')
    const surface = root.locator('[data-workspace-node-part="surface"]')
    const header = root.locator('[data-workspace-node-part="header"]')
    const caseId = await fixtureCase.getAttribute(
      "data-ontology-node-bounds-case"
    )
    const expectedWidth = Number(
      await fixtureCase.getAttribute("data-expected-width")
    )
    const expectedHeight = Number(
      await fixtureCase.getAttribute("data-expected-height")
    )
    const rootBox = await root.boundingBox()

    expect(rootBox, `${caseId} root must be measurable`).not.toBeNull()
    expect(rootBox?.width, `${caseId} width`).toBe(expectedWidth)
    expect(rootBox?.height, `${caseId} height`).toBe(expectedHeight)
    await expectInside(root, surface, `${caseId} surface`)
    await expectInside(root, header, `${caseId} header`)

    const visibleContent = root.locator(
      '[data-workspace-node-part="header"] > *, [data-workspace-node-part="header"] > div > *, [data-workspace-node-part="header"] > div > div > *'
    )
    const contentCount = await visibleContent.count()
    for (let contentIndex = 0; contentIndex < contentCount; contentIndex += 1) {
      await expectInside(
        root,
        visibleContent.nth(contentIndex),
        `${caseId} visible child ${contentIndex + 1}`
      )
    }

    const overflow = await root.evaluate((element) => ({
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
    }))
    expect(
      overflow.scrollWidth,
      `${caseId} horizontal overflow`
    ).toBeLessThanOrEqual(overflow.clientWidth)
    expect(
      overflow.scrollHeight,
      `${caseId} vertical overflow`
    ).toBeLessThanOrEqual(overflow.clientHeight)
  }
})
