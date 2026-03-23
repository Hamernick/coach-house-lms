import { describe, expect, it } from "vitest"

import {
  buildPrototypeLabInput,
  listPrototypeLabSidebarTree,
  resolvePrototypeLabSelectedEntryId,
  resolvePrototypeLabSidebarOpenFolderIds,
} from "@/features/prototype-lab"

describe("prototype lab feature", () => {
  it("defaults to the invite composer entry", () => {
    const input = buildPrototypeLabInput({
      selectedEntryId: null,
    })

    expect(input.selectedEntry.id).toBe("team-invite-sheet")
  })

  it("falls back to the first project entry when the caller targets a project without an explicit entry", () => {
    expect(
      resolvePrototypeLabSelectedEntryId({
        entryId: null,
        projectId: "email-gallery",
      }),
    ).toBe("organization-external-invite")
  })

  it("builds the sidebar tree used under the Prototypes nav item", () => {
    const tree = listPrototypeLabSidebarTree()
    const invitesFolder = tree.find((node) => node.id === "invites")
    const emailGalleryFolder = tree.find((node) => node.id === "email-gallery")
    const flowsFolder =
      invitesFolder?.kind === "folder"
        ? invitesFolder.children.find((node) => node.id === "invites:flows")
        : null
    const inviteComposerEntry =
      flowsFolder?.kind === "folder"
        ? flowsFolder.children.find((node) => node.id === "team-invite-sheet")
        : null

    expect(invitesFolder?.kind).toBe("folder")
    expect(emailGalleryFolder?.kind).toBe("folder")
    expect(flowsFolder?.kind).toBe("folder")
    expect(inviteComposerEntry?.kind === "entry" ? inviteComposerEntry.href : null).toContain(
      "/admin/platform/prototypes?entry=team-invite-sheet",
    )
  })

  it("opens the active prototype folder path by default", () => {
    expect(resolvePrototypeLabSidebarOpenFolderIds("team-invite-sheet")).toEqual([
      "invites",
      "invites:flows",
    ])
    expect(resolvePrototypeLabSidebarOpenFolderIds("supabase-reset-password")).toEqual([
      "email-gallery",
      "email-gallery:auth",
    ])
  })
})
