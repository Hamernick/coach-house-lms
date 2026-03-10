import { describe, expect, it } from "vitest"

import {
  isWorkspaceInviteAccessAvailable,
  resolveWorkspaceInviteAccessCopy,
  resolveWorkspaceTeamInviteRole,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-invite-sheet-helpers"

describe("workspace board invite sheet helpers", () => {
  it("maps team access levels to the correct organization roles", () => {
    expect(resolveWorkspaceTeamInviteRole("viewer")).toBe("board")
    expect(resolveWorkspaceTeamInviteRole("editor")).toBe("staff")
  })

  it("only allows temporary editor access", () => {
    expect(isWorkspaceInviteAccessAvailable("temporary", "editor")).toBe(true)
    expect(isWorkspaceInviteAccessAvailable("temporary", "viewer")).toBe(false)
    expect(isWorkspaceInviteAccessAvailable("team", "viewer")).toBe(true)
  })

  it("returns honest helper copy for unsupported temporary viewer access", () => {
    expect(resolveWorkspaceInviteAccessCopy("temporary", "viewer")).toEqual({
      title: "Temporary viewer access unavailable",
      description:
        "Use Team and choose Viewer for read-only access. Temporary invites currently grant editor collaboration only.",
    })
  })
})
