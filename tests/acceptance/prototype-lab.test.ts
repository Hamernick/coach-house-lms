import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import {
  buildPrototypeLabInput,
  listPrototypeLabSidebarTree,
  resolvePrototypeLabSelectedEntryId,
  resolvePrototypeLabSidebarOpenFolderIds,
} from "@/features/prototype-lab"

describe("prototype lab feature", () => {
  it("defaults to the fiscal sponsorship flow entry", () => {
    const input = buildPrototypeLabInput({
      selectedEntryId: null,
    })

    expect(input.selectedEntry.id).toBe("fiscal-sponsorship-flow")
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
    const userJourneysFolder = tree.find((node) => node.id === "user-journeys")
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
    expect(userJourneysFolder?.kind).toBe("folder")
    expect(flowsFolder?.kind).toBe("folder")
    expect(inviteComposerEntry?.kind === "entry" ? inviteComposerEntry.href : null).toContain(
      "/admin/platform/prototypes?entry=team-invite-sheet",
    )
  })

  it("lists the user journey atlas as a prototype entry", () => {
    const input = buildPrototypeLabInput({
      selectedEntryId: "user-journey-atlas",
    })
    const panelSource = readFileSync(
      "src/features/prototype-lab/components/prototype-lab-panel.tsx",
      "utf8",
    )

    expect(input.selectedEntry).toMatchObject({
      id: "user-journey-atlas",
      projectId: "user-journeys",
      title: "User journey atlas",
    })
    expect(resolvePrototypeLabSidebarOpenFolderIds("user-journey-atlas")).toEqual([
      "user-journeys",
      "user-journeys:flows",
    ])
    expect(panelSource).toContain("h-full min-h-0 flex-1 overflow-hidden")
  })

  it("lists the activation monitor under user journey operations", () => {
    const input = buildPrototypeLabInput({
      selectedEntryId: "activation-monitor",
    })
    const tree = listPrototypeLabSidebarTree()
    const userJourneysFolder = tree.find((node) => node.id === "user-journeys")
    const operationsFolder =
      userJourneysFolder?.kind === "folder"
        ? userJourneysFolder.children.find(
            (node) => node.id === "user-journeys:operations",
          )
        : null
    const activationMonitorEntry =
      operationsFolder?.kind === "folder"
        ? operationsFolder.children.find((node) => node.id === "activation-monitor")
        : null

    expect(input.selectedEntry).toMatchObject({
      id: "activation-monitor",
      projectId: "user-journeys",
      title: "Activation monitor",
      kind: "ops",
    })
    expect(activationMonitorEntry?.kind === "entry" ? activationMonitorEntry.href : null).toBe(
      "/admin/platform/prototypes?entry=activation-monitor",
    )
    expect(resolvePrototypeLabSidebarOpenFolderIds("activation-monitor")).toEqual([
      "user-journeys",
      "user-journeys:operations",
    ])
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
