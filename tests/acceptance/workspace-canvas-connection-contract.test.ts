import { describe, expect, it } from "vitest"

import {
  canConnectWorkspaceCards,
  validateWorkspaceConnection,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/contracts/workspace-connection-contract"

describe("workspace canvas connection contract", () => {
  it("allows expected happy-path connections", () => {
    expect(
      canConnectWorkspaceCards({
        source: "organization-overview",
        target: "programs",
      }),
    ).toBe(true)
    expect(
      canConnectWorkspaceCards({
        source: "brand-kit",
        target: "communications",
      }),
    ).toBe(true)
    expect(
      canConnectWorkspaceCards({
        source: "accelerator",
        target: "calendar",
      }),
    ).toBe(true)
    expect(
      canConnectWorkspaceCards({
        source: "calendar",
        target: "brand-kit",
      }),
    ).toBe(true)
  })

  it("rejects same-node links", () => {
    expect(
      validateWorkspaceConnection({
        source: "accelerator",
        target: "accelerator",
      }),
    ).toEqual({ allowed: false, reason: "same-node" })
  })

  it("allows linking into and out of vault", () => {
    expect(
      canConnectWorkspaceCards({
        source: "communications",
        target: "vault",
      }),
    ).toBe(true)
    expect(
      canConnectWorkspaceCards({
        source: "economic-engine",
        target: "vault",
      }),
    ).toBe(true)
    expect(
      canConnectWorkspaceCards({
        source: "vault",
        target: "communications",
      }),
    ).toBe(true)
  })
})
