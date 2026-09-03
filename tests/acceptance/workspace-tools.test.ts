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

  it("owns the Google Drive connection UI without Documents file selection", () => {
    const rowSource = readSource(
      "src/features/workspace-tools/components/workspace-tool-row.tsx"
    )
    const connectionSource = readSource(
      "src/features/workspace-tools/components/google-drive-connection.tsx"
    )
    const panelSource = readSource(
      "src/features/workspace-tools/components/workspace-tools-panel.tsx"
    )

    expect(rowSource).toContain("GoogleDriveConnection")
    expect(rowSource).toContain("WorkspaceToolBrandIcon")
    expect(connectionSource).toContain(
      '"/api/integrations/google-drive/connection"'
    )
    expect(connectionSource).toContain(
      '"/api/integrations/google-drive/connect"'
    )
    expect(connectionSource).toContain(
      '"/api/integrations/google-drive/disconnect"'
    )
    expect(connectionSource).toContain("Disconnect Google Drive?")
    expect(connectionSource).toContain('aria-label="Google Drive connection"')
    expect(connectionSource).toContain("checked={connected}")
    expect(connectionSource).toContain("onCheckedChange")
    expect(connectionSource).toContain("onCloseAutoFocus")
    expect(connectionSource).toContain("connectionControlRef.current?.focus()")
    expect(connectionSource).not.toContain("Disconnect…")
    expect(connectionSource).toContain("/workspace?drawer=tools")
    expect(connectionSource).toContain("googleDriveErrorTitle")
    expect(connectionSource).toContain("<Alert")
    expect(connectionSource).toContain("Try Again")
    expect(connectionSource).toContain("rounded-2xl")
    expect(connectionSource).toContain("workspace-tools:google-drive-error")
    expect(connectionSource).not.toContain("picker-token")
    expect(panelSource).toContain('type="search"')
    expect(panelSource).toContain("No tools found")
    expect(panelSource).toContain("Clear search")
    expect(panelSource).toContain('ownerId: "workspace-tools:panel"')
  })
})
