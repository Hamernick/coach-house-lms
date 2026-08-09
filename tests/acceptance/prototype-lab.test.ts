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
      })
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
    expect(
      inviteComposerEntry?.kind === "entry" ? inviteComposerEntry.href : null
    ).toContain("/admin/platform/prototypes?entry=team-invite-sheet")
  })

  it("lists the user journey atlas as a prototype entry", () => {
    const input = buildPrototypeLabInput({
      selectedEntryId: "user-journey-atlas",
    })
    const panelSource = readFileSync(
      "src/features/prototype-lab/components/prototype-lab-panel.tsx",
      "utf8"
    )

    expect(input.selectedEntry).toMatchObject({
      id: "user-journey-atlas",
      projectId: "user-journeys",
      title: "User journey atlas",
    })
    expect(
      resolvePrototypeLabSidebarOpenFolderIds("user-journey-atlas")
    ).toEqual(["user-journeys", "user-journeys:flows"])
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
            (node) => node.id === "user-journeys:operations"
          )
        : null
    const activationMonitorEntry =
      operationsFolder?.kind === "folder"
        ? operationsFolder.children.find(
            (node) => node.id === "activation-monitor"
          )
        : null

    expect(input.selectedEntry).toMatchObject({
      id: "activation-monitor",
      projectId: "user-journeys",
      title: "Activation monitor",
      kind: "ops",
    })
    expect(
      activationMonitorEntry?.kind === "entry"
        ? activationMonitorEntry.href
        : null
    ).toBe("/admin/platform/prototypes?entry=activation-monitor")
    expect(
      resolvePrototypeLabSidebarOpenFolderIds("activation-monitor")
    ).toEqual(["user-journeys", "user-journeys:operations"])
  })

  it("lists the audio visualizer player prototype", () => {
    const input = buildPrototypeLabInput({
      selectedEntryId: "audio-visualizer-player",
    })
    const tree = listPrototypeLabSidebarTree()
    const audioLabFolder = tree.find((node) => node.id === "audio-lab")
    const controlsFolder =
      audioLabFolder?.kind === "folder"
        ? audioLabFolder.children.find(
            (node) => node.id === "audio-lab:controls"
          )
        : null
    const playerEntry =
      controlsFolder?.kind === "folder"
        ? controlsFolder.children.find(
            (node) => node.id === "audio-visualizer-player"
          )
        : null
    const panelSource = readFileSync(
      "src/features/prototype-lab/components/prototype-lab-panel.tsx",
      "utf8"
    )
    const componentSource = readFileSync(
      "src/features/prototype-lab/components/audio-visualizer-player-prototype.tsx",
      "utf8"
    )
    const routeSource = readFileSync(
      "src/app/api/prototypes/presenter-audio/route.ts",
      "utf8"
    )
    const audioPlayerSource = readFileSync(
      "src/components/ui/audio-player.tsx",
      "utf8"
    )
    const audioPlayerProviderSource = readFileSync(
      "src/components/ui/audio-player-provider.tsx",
      "utf8"
    )
    const barVisualizerSource = readFileSync(
      "src/components/ui/bar-visualizer.tsx",
      "utf8"
    )
    const barVisualizerAudioSource = readFileSync(
      "src/components/ui/bar-visualizer-audio.ts",
      "utf8"
    )

    expect(input.selectedEntry).toMatchObject({
      id: "audio-visualizer-player",
      projectId: "audio-lab",
      title: "Audio visualizer player",
      kind: "ops",
    })
    expect(playerEntry?.kind === "entry" ? playerEntry.href : null).toBe(
      "/admin/platform/prototypes?entry=audio-visualizer-player"
    )
    expect(
      resolvePrototypeLabSidebarOpenFolderIds("audio-visualizer-player")
    ).toEqual(["audio-lab", "audio-lab:controls"])
    expect(panelSource).toContain('entryId === "audio-visualizer-player"')
    expect(componentSource).toContain("AudioPlayerProvider")
    expect(componentSource).toContain("AudioPlayerButton")
    expect(componentSource).toContain("AudioPlayerProgress")
    expect(componentSource).toContain("BarVisualizer")
    expect(componentSource).toContain("captureStream")
    expect(componentSource).toContain("getAudioTracks().length")
    expect(componentSource).toContain("setActiveItem(PRESENTER_AUDIO_ITEM)")
    expect(componentSource).toContain("Audio progress")
    expect(audioPlayerSource).toContain("AudioPlayerProvider")
    expect(audioPlayerSource).toContain("AudioPlayerProgress")
    expect(audioPlayerSource).toContain("AudioPlayerButton")
    expect(audioPlayerProviderSource).toContain("function maybeUpdateState")
    expect(audioPlayerProviderSource).toContain(
      "maybeUpdateState(networkState, audio.networkState, setNetworkState)"
    )
    expect(audioPlayerProviderSource).toContain(
      "const minimumTimeDelta = audio.paused ? 0 : 0.05"
    )
    expect(audioPlayerProviderSource).not.toContain(
      "setNetworkState(audioRef.current.networkState)"
    )
    expect(barVisualizerAudioSource).toContain("function hasAudioTracks")
    expect(barVisualizerAudioSource).toContain("): mediaStream is MediaStream")
    expect(barVisualizerAudioSource).toContain("audioContext.resume()")
    expect(barVisualizerSource).toContain("loPass: 2")
    expect(barVisualizerSource).toContain("hiPass: 96")
    expect(barVisualizerSource).toContain("useMultibandVolume")
    expect(barVisualizerSource).toContain("mediaStream?: MediaStream | null")
    expect(routeSource).toContain("Accept-Ranges")
    expect(routeSource).toContain("PROTOTYPE_PRESENTER_AUDIO_PATH")
  })

  it("opens the active prototype folder path by default", () => {
    expect(
      resolvePrototypeLabSidebarOpenFolderIds("team-invite-sheet")
    ).toEqual(["invites", "invites:flows"])
    expect(
      resolvePrototypeLabSidebarOpenFolderIds("supabase-reset-password")
    ).toEqual(["email-gallery", "email-gallery:auth"])
  })
})
