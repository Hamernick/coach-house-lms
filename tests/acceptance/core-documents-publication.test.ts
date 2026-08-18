import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  resolveOrganizationCoreDocuments,
  resolvePublicOrganizationProfileNarratives,
  updateOrganizationCoreDocuments,
  updateRoadmapSection,
} from "@/lib/roadmap"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("Core Documents publication", () => {
  it("keeps untouched legacy public-profile narratives visible", () => {
    expect(
      resolvePublicOrganizationProfileNarratives({
        origin_story: "Legacy origin",
        need: "Legacy need",
        mission: "Legacy mission",
        vision: "Legacy vision",
        values: ["Care", "Trust"],
        theory_of_change: "Legacy theory",
      })
    ).toEqual({
      originStory: "Legacy origin",
      needStatement: "Legacy need",
      mission: "Legacy mission",
      vision: "Legacy vision",
      values: "Care\nTrust",
      theoryOfChange: "Legacy theory",
    })
  })

  it("keeps saved drafts off the public organization profile", () => {
    const lastUpdated = "2026-08-18T18:00:00.000Z"

    expect(
      resolvePublicOrganizationProfileNarratives({
        origin_story: "Previously public origin",
        need: "Previously public need",
        mission: "Previously public mission",
        vision: "Previously public vision",
        values: "Previously public values",
        theory_of_change: "Previously public theory",
        roadmap: {
          sections: [
            {
              id: "origin_story",
              content: "<p>Draft origin</p>",
              status: "in_progress",
              lastUpdated,
              publicProfileStatusControlled: true,
            },
            {
              id: "need",
              content: "<p>Draft need</p>",
              status: "in_progress",
              lastUpdated,
              publicProfileStatusControlled: true,
            },
            {
              id: "mission_vision_values",
              content: "<p>Draft mission</p>",
              status: "in_progress",
              lastUpdated,
              publicProfileStatusControlled: true,
            },
            {
              id: "vision",
              content: "<p>Draft vision</p>",
              status: "in_progress",
              lastUpdated,
              publicProfileStatusControlled: true,
            },
            {
              id: "values",
              content: "<p>Draft values</p>",
              status: "in_progress",
              lastUpdated,
              publicProfileStatusControlled: true,
            },
            {
              id: "theory_of_change",
              content: "<p>Draft theory</p>",
              status: "in_progress",
              lastUpdated,
              publicProfileStatusControlled: true,
            },
          ],
        },
      })
    ).toEqual({
      originStory: "",
      needStatement: "",
      mission: "",
      vision: "",
      values: "",
      theoryOfChange: "",
    })
  })

  it("preserves the previous public version while a replacement is drafted", () => {
    const initiallyPublic = updateRoadmapSection({}, "need", {
      content: "<p>Current public need</p>",
      status: "complete",
    })
    const drafting = updateRoadmapSection(initiallyPublic.nextProfile, "need", {
      content: "<p>Private replacement</p>",
      status: "in_progress",
    })

    expect(drafting.section.publishedContent).toBe("<p>Current public need</p>")
    expect(
      resolvePublicOrganizationProfileNarratives(drafting.nextProfile)
        .needStatement
    ).toBe("Current public need")

    const republished = updateRoadmapSection(drafting.nextProfile, "need", {
      status: "complete",
    })
    expect(republished.section.publishedContent).toBeUndefined()
    expect(
      resolvePublicOrganizationProfileNarratives(republished.nextProfile)
        .needStatement
    ).toBe("Private replacement")
  })

  it("keeps legacy public content stable when publication controls activate", () => {
    const drafting = updateRoadmapSection(
      { need: "Legacy public need" },
      "need",
      {
        content: "<p>Private replacement</p>",
        status: "in_progress",
      }
    )

    expect(drafting.section.publicProfileStatusControlled).toBe(true)
    expect(drafting.section.publishedContent).toBe("Legacy public need")
    expect(
      resolvePublicOrganizationProfileNarratives(drafting.nextProfile)
        .needStatement
    ).toBe("Legacy public need")
  })

  it("activates draft privacy when a legacy document is edited", () => {
    const edited = updateRoadmapSection(
      {
        roadmap: {
          sections: [
            {
              id: "mission_vision_values",
              content: "<p>Current public mission</p>",
              status: "in_progress",
              lastUpdated: "2026-08-17T18:00:00.000Z",
            },
          ],
        },
      },
      "mission_vision_values",
      { content: "<p>Private replacement</p>" }
    )

    expect(edited.section.publicProfileStatusControlled).toBe(true)
    expect(edited.section.publishedContent).toBe(
      "<p>Current public mission</p>"
    )
    expect(
      resolvePublicOrganizationProfileNarratives(edited.nextProfile).mission
    ).toBe("Current public mission")
  })

  it("routes all six profile and homework narratives through Core Documents", () => {
    const updated = updateOrganizationCoreDocuments(
      { need: "Legacy need" },
      {
        originStory: "Origin",
        need: "Need",
        mission: "Mission",
        vision: "Vision",
        values: "Values",
        theoryOfChange: "Theory",
      }
    )

    expect(resolveOrganizationCoreDocuments(updated.nextProfile)).toEqual({
      originStory: "<p>Origin</p>",
      need: "<p>Need</p>",
      mission: "<p>Mission</p>",
      vision: "<p>Vision</p>",
      values: "<p>Values</p>",
      theoryOfChange: "<p>Theory</p>",
    })

    const organizationAction = readSource("src/actions/organization.ts")
    const assignmentSync = readSource(
      "src/app/api/modules/[id]/assignment-submission/_lib/profile-sync.ts"
    )
    const assignmentRoute = readSource(
      "src/app/api/modules/[id]/assignment-submission/route.ts"
    )
    expect(organizationAction).toContain("updateOrganizationCoreDocuments")
    expect(assignmentSync).toContain("getOrganizationCoreDocumentKey")
    expect(assignmentSync).toContain("updateOrganizationCoreDocuments")
    expect(assignmentRoute).toContain(
      'revalidateTag("public-map-organizations", "max")'
    )
  })

  it("projects public Core Documents into the public profile", () => {
    const lastUpdated = "2026-08-18T18:00:00.000Z"
    const section = (id: string, content: string) => ({
      id,
      content,
      status: "complete",
      lastUpdated,
      publicProfileStatusControlled: true,
    })

    expect(
      resolvePublicOrganizationProfileNarratives({
        roadmap: {
          sections: [
            section("origin_story", "<p>Public <strong>origin</strong></p>"),
            section("need", "<p>Public need</p>"),
            section("mission_vision_values", "<p>Public mission</p>"),
            section("vision", "<p>Public vision</p>"),
            section("values", "<ul><li>Care</li><li>Trust</li></ul>"),
            section("theory_of_change", "<p>Public theory</p>"),
          ],
        },
      })
    ).toEqual({
      originStory: "Public origin",
      needStatement: "Public need",
      mission: "Public mission",
      vision: "Public vision",
      values: "- Care\n- Trust",
      theoryOfChange: "Public theory",
    })
  })

  it("uses the new labels, keeps colors, and refreshes the public map", () => {
    const panel = readSource("src/components/roadmap/roadmap-section-panel.tsx")
    const editor = readSource(
      "src/components/roadmap/roadmap-editor/hooks/use-roadmap-editor-state.ts"
    )
    const action = readSource("src/actions/roadmap.ts")
    const publicMapQuery = readSource("src/lib/queries/public-map-index.ts")

    expect(panel).toContain(
      '<SelectItem value="not_started">Not started</SelectItem>'
    )
    expect(panel).toContain('{controlsPublicProfile ? "Draft" : "In progress"}')
    expect(panel).toContain('{controlsPublicProfile ? "Public" : "Complete"}')
    expect(panel).toContain('"Core document publication status"')
    expect(panel).toContain('status === "complete" ? "bg-emerald-500"')
    expect(panel).toContain(
      'status === "in_progress" ? "bg-amber-500" : "bg-border"'
    )
    expect(editor).toContain("expectedLastUpdated: activeSection.lastUpdated")
    expect(editor).toContain("content: draft.content")
    expect(action).toContain('revalidateTag("public-map-organizations", "max")')
    expect(action).toContain('revalidatePath("/find")')
    expect(publicMapQuery).toContain(
      "resolvePublicOrganizationProfileNarratives(profile)"
    )
  })
})
