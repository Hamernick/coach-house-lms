import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { MemberWorkspaceClearStarterDataButton } from "@/features/member-workspace/components/shared/member-workspace-clear-starter-data-button"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: () => undefined,
  }),
}))

describe("MemberWorkspaceClearStarterDataButton", () => {
  it("renders a visible clear-demo-data trigger", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MemberWorkspaceClearStarterDataButton, {
        clearStarterDataAction: async () => ({ ok: true }),
      }),
    )

    expect(markup).toContain("Clear demo data")
  })
})
