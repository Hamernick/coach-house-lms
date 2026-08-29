import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import {
  WORKSPACE_TOOL_DEFINITIONS,
  workspaceToolMatchesQuery,
} from "@/features/workspace-tools"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("workspace-tools feature contract", () => {
  it("offers the approved Stripe and Google Drive catalog", () => {
    expect(WORKSPACE_TOOL_DEFINITIONS.map((tool) => tool.id)).toEqual([
      "stripe",
      "google-drive",
    ])
    expect(
      WORKSPACE_TOOL_DEFINITIONS.filter((tool) =>
        workspaceToolMatchesQuery(tool, "payments")
      ).map((tool) => tool.id)
    ).toEqual(["stripe"])
    expect(
      WORKSPACE_TOOL_DEFINITIONS.filter((tool) =>
        workspaceToolMatchesQuery(tool, "docs")
      ).map((tool) => tool.id)
    ).toEqual(["google-drive"])
    expect(
      WORKSPACE_TOOL_DEFINITIONS.filter((tool) =>
        workspaceToolMatchesQuery(tool, "calendar")
      )
    ).toEqual([])
  })

  it("reuses the authorized Finance Stripe owner", () => {
    const rowSource = readSource(
      "src/features/workspace-tools/components/workspace-tool-row.tsx"
    )
    const stripeSource = readSource(
      "src/features/workspace-finance/components/workspace-finance-stripe-connection.tsx"
    )

    expect(rowSource).toContain("WorkspaceFinanceStripeConnection")
    expect(rowSource).toContain('tool.id === "stripe"')
    expect(rowSource).toContain("router.refresh()")
    expect(stripeSource).toContain(
      '"/api/account/finance-connections/stripe/sync"'
    )
    expect(stripeSource).toContain(
      'action="/api/account/finance-connections/stripe/start"'
    )
    expect(stripeSource).toContain("siStripe.path")
  })

  it("keeps Google Drive visibly unconfigured and non-interactive", () => {
    const rowSource = readSource(
      "src/features/workspace-tools/components/workspace-tool-row.tsx"
    )
    const panelSource = readSource(
      "src/features/workspace-tools/components/workspace-tools-panel.tsx"
    )

    expect(rowSource).toContain("Setup required")
    expect(rowSource).toContain("No Drive data is shared yet.")
    expect(rowSource).toContain("WorkspaceToolBrandIcon")
    expect(rowSource).not.toContain("Connect Google")
    expect(panelSource).toContain('type="search"')
    expect(panelSource).toContain("No tools found")
    expect(panelSource).toContain("Clear search")
    expect(panelSource).toContain('ownerId: "workspace-tools:panel"')
  })
})
