import { readFileSync } from "node:fs"
import { join } from "node:path"

import { afterEach, describe, expect, it, vi } from "vitest"

import {
  isWorkspaceFoundationRolloutEnabled,
  resolveWorkspaceFoundationLegacyDestination,
} from "@/lib/workspace/foundation-rollout"
import { resolveWorkspaceFoundationPageMode } from "@/app/(dashboard)/my-organization/_lib/my-organization-page-rollout"
import { resolveMyOrganizationPageSearchState } from "@/app/(dashboard)/my-organization/_lib/my-organization-page-search"

const identity = { orgId: "org-1", userId: "user-1" }
const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("workspace foundation rollout", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("defaults off and requires the private kill switch plus an allowlist match", () => {
    expect(
      isWorkspaceFoundationRolloutEnabled({
        ...identity,
        environment: {},
      })
    ).toBe(false)
    expect(
      isWorkspaceFoundationRolloutEnabled({
        ...identity,
        environment: {
          WORKSPACE_FOUNDATION_ROLLOUT_ENABLED: "1",
        },
      })
    ).toBe(false)
    expect(
      isWorkspaceFoundationRolloutEnabled({
        ...identity,
        environment: {
          WORKSPACE_FOUNDATION_ROLLOUT_ENABLED: "0",
          WORKSPACE_FOUNDATION_ROLLOUT_ORG_IDS: "org-1",
          WORKSPACE_FOUNDATION_ROLLOUT_USER_IDS: "user-1",
        },
      })
    ).toBe(false)
  })

  it("allows only a matching organization or user when enabled", () => {
    expect(
      isWorkspaceFoundationRolloutEnabled({
        ...identity,
        environment: {
          WORKSPACE_FOUNDATION_ROLLOUT_ENABLED: "1",
          WORKSPACE_FOUNDATION_ROLLOUT_ORG_IDS: "other, ORG-1 ",
        },
      })
    ).toBe(true)
    expect(
      isWorkspaceFoundationRolloutEnabled({
        ...identity,
        environment: {
          WORKSPACE_FOUNDATION_ROLLOUT_ENABLED: "1",
          WORKSPACE_FOUNDATION_ROLLOUT_USER_IDS: " USER-1 ",
        },
      })
    ).toBe(true)
    expect(
      isWorkspaceFoundationRolloutEnabled({
        ...identity,
        environment: {
          WORKSPACE_FOUNDATION_ROLLOUT_ENABLED: "1",
          WORKSPACE_FOUNDATION_ROLLOUT_ORG_IDS: "org-2",
          WORKSPACE_FOUNDATION_ROLLOUT_USER_IDS: "user-2",
        },
      })
    ).toBe(false)
  })

  it("preserves legacy destinations when later drawer routes are disabled", () => {
    const baseRequest = {
      acceleratorGroup: null,
      acceleratorModuleId: null,
      acceleratorStepId: null,
      drawer: "",
      focus: "",
      organizationTab: "",
      programId: "",
      roadmapSection: null,
      view: "",
    }

    expect(
      resolveWorkspaceFoundationLegacyDestination({
        ...baseRequest,
        drawer: "organization",
        organizationTab: "programs",
        programId: "program-1",
      })
    ).toBe("/workspace?view=editor&tab=programs&programId=program-1")
    expect(
      resolveWorkspaceFoundationLegacyDestination({
        ...baseRequest,
        drawer: "people",
      })
    ).toBe("/workspace?view=editor&tab=people")
    expect(
      resolveWorkspaceFoundationLegacyDestination({
        ...baseRequest,
        drawer: "documents",
        focus: "w9",
      })
    ).toBe("/organization/documents?focus=w9")
    expect(
      resolveWorkspaceFoundationLegacyDestination({
        ...baseRequest,
        drawer: "roadmap",
        roadmapSection: "origin-story",
      })
    ).toBe("/workspace/roadmap/origin-story")
    expect(
      resolveWorkspaceFoundationLegacyDestination({
        ...baseRequest,
        acceleratorModuleId: "module-1",
        acceleratorStepId: "module-1:video",
        view: "accelerator",
      })
    ).toBe("/accelerator?module=module-1&step=module-1%3Avideo")
    expect(resolveWorkspaceFoundationLegacyDestination(baseRequest)).toBeNull()
  })

  it("keeps page mode default-off and preserves legacy editor routing", async () => {
    vi.stubEnv("WORKSPACE_FOUNDATION_ROLLOUT_ENABLED", "0")
    vi.stubEnv("WORKSPACE_FOUNDATION_ROLLOUT_ORG_IDS", identity.orgId)
    const searchState = await resolveMyOrganizationPageSearchState(
      Promise.resolve({
        programId: "program-1",
        tab: "programs",
        view: "editor",
      })
    )

    expect(
      resolveWorkspaceFoundationPageMode({
        needsInitialOnboarding: false,
        ...identity,
        searchState,
      })
    ).toMatchObject({
      enabled: false,
      initialDrawerData: {
        initialDrawerTab: null,
        initialProgramId: null,
        initialProfileTab: null,
      },
      legacyDestination: null,
      showLegacyEditor: true,
    })

    const drawerSearchState = await resolveMyOrganizationPageSearchState(
      Promise.resolve({ drawer: "people" })
    )
    expect(
      resolveWorkspaceFoundationPageMode({
        needsInitialOnboarding: false,
        ...identity,
        searchState: drawerSearchState,
      }).legacyDestination
    ).toBe("/workspace?view=editor&tab=people")
  })

  it("gates server rendering, taxonomy reads, and later People mutations", () => {
    const pageSource = readSource(
      "src/app/(dashboard)/my-organization/_lib/my-organization-page-content.tsx"
    )
    const pageRolloutSource = readSource(
      "src/app/(dashboard)/my-organization/_lib/my-organization-page-rollout.ts"
    )
    const surfaceSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-view.tsx"
    )
    const peopleStateSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-people-state.ts"
    )
    const peoplePlacementSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-people-placement-controller.ts"
    )
    const peoplePlacementStorageSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/use-stored-workspace-person-placements.ts"
    )
    const peopleControlsSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-overlay-people-controls.tsx"
    )
    const peopleSource = readSource("src/actions/people.ts")
    const segmentSource = readSource("src/actions/people-segments.ts")
    const tagSource = readSource("src/actions/people-tags.ts")

    expect(pageRolloutSource).toContain("isWorkspaceFoundationRolloutEnabled")
    expect(pageSource).toMatch(
      /workspaceFoundationEnabled\s+\? loadOrganizationPeopleTaxonomy/
    )
    expect(pageSource).toContain("showLegacyEditor")
    expect(surfaceSource).toContain(
      "workspaceFoundationEnabled ? onOpenWorkspaceDataDrawer : null"
    )
    expect(surfaceSource).toMatch(
      /workspaceFoundationEnabled \? \(\s+<WorkspaceCanvasOverlayDrawer/
    )
    expect(peopleStateSource).toContain(
      "workspaceFoundationEnabled && (allowEditing || workspaceDataDrawerCanEdit)"
    )
    expect(peoplePlacementStorageSource).toContain(
      "resolveWorkspaceCanvasPersonPlacements"
    )
    expect(peoplePlacementSource).toContain("canMutateWorkspaceCanvasPeople")
    expect(peoplePlacementSource).toContain(
      "workspacePersonFitRequest: enabled ? fitRequest : null"
    )
    expect(peoplePlacementSource).toContain("if (!enabled) return")
    expect(peopleSource).toContain('return { error: "Not available." }')
    expect(peopleSource).toContain("extendedSocialWriteRequested")
    expect(peopleControlsSource).toContain("extendedSocialLinksEnabled")
    expect(segmentSource).toContain("isWorkspaceFoundationRolloutEnabled")
    expect(tagSource).toContain("isWorkspaceFoundationRolloutEnabled")
  })
})
