import { describe, expect, it } from "vitest"

import {
  shouldRenderWorkspaceBoardVaultCardDisplayOnly,
  WORKSPACE_BOARD_VAULT_TUTORIAL_LOCK_MESSAGE,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-node-tool-card-vault"

describe("workspace board vault card", () => {
  it("renders the documents tutorial presentation as display-only", () => {
    expect(
      shouldRenderWorkspaceBoardVaultCardDisplayOnly({
        presentationMode: true,
        tutorialStepId: "roadmap",
      }),
    ).toBe(true)
  })

  it("keeps live vault surfaces interactive outside the documents tutorial step", () => {
    expect(
      shouldRenderWorkspaceBoardVaultCardDisplayOnly({
        presentationMode: false,
        tutorialStepId: "roadmap",
      }),
    ).toBe(true)
    expect(
      shouldRenderWorkspaceBoardVaultCardDisplayOnly({
        presentationMode: true,
        tutorialStepId: "calendar",
      }),
    ).toBe(false)
    expect(
      shouldRenderWorkspaceBoardVaultCardDisplayOnly({
        presentationMode: true,
        tutorialStepId: null,
      }),
    ).toBe(false)
  })

  it("uses the shared later hint copy for the documents tutorial shield", () => {
    expect(WORKSPACE_BOARD_VAULT_TUTORIAL_LOCK_MESSAGE).toBe(
      "We'll go over this later :)",
    )
  })
})
