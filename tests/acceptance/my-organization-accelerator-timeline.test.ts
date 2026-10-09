import { describe, expect, it, vi } from "vitest"
import { getClassModulesForUser } from "@/lib/modules"

import {
  buildAcceleratorTimelineModules,
  buildModuleGroupMetaById,
  isOrganizationSetupTimelineModule,
  resolveWorkspaceAcceleratorSupplementalResources,
} from "@/app/(dashboard)/my-organization/_lib/my-organization-accelerator-timeline"

vi.mock("@/lib/modules", () => ({ getClassModulesForUser: vi.fn() }))

describe("my-organization accelerator timeline helpers", () => {
  it("loads fallback metadata while class context is pending and preserves the lesson", async () => {
    let resolveContext!: (
      value: Awaited<ReturnType<typeof getClassModulesForUser>>
    ) => void
    vi.mocked(getClassModulesForUser).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveContext = resolve
      })
    )
    const rows: Record<string, unknown[]> = {
      module_content: [
        {
          module_id: "lesson",
          video_url: "https://example.org/lesson",
          resources: [],
        },
      ],
      module_assignments: [{ module_id: "lesson" }],
      modules: [
        {
          id: "lesson",
          video_url: null,
          duration_minutes: 12,
          deck_path: "deck.pdf",
        },
      ],
    }
    const from = vi.fn((table: string) => ({
      select: () => ({
        in: () => ({
          returns: () => Promise.resolve({ data: rows[table], error: null }),
        }),
      }),
    }))
    const result = buildAcceleratorTimelineModules({
      supabase: { from } as unknown as Parameters<
        typeof buildAcceleratorTimelineModules
      >[0]["supabase"],
      userId: "viewer",
      sortedRoadmapModules: [
        {
          id: "lesson",
          slug: "lesson",
          title: "Lesson",
          description: null,
          href: "/accelerator/class/formation/module/1",
          status: "in_progress",
          index: 1,
          hasNotes: false,
        },
      ],
      groupMetaById: new Map([
        ["lesson", { title: "Formation", order: 0, published: true }],
      ]),
    })
    // Metadata must start before the slow context resolves, not after it.
    const startedTables = from.mock.calls.map(([table]) => table)
    resolveContext({
      classId: "formation",
      classTitle: "Formation",
      classDescription: null,
      classSubtitle: null,
      classVideoUrl: null,
      classResources: [],
      classPublished: true,
      modules: [],
      progressMap: {},
    })
    const lessons = await result
    expect(startedTables).toEqual([
      "module_content",
      "module_assignments",
      "modules",
    ])
    expect(getClassModulesForUser).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "viewer", forceAdmin: false })
    )
    expect(lessons).toEqual([
      expect.objectContaining({
        id: "lesson",
        status: "in_progress",
        published: true,
        videoUrl: "https://example.org/lesson",
        durationMinutes: 12,
        hasAssignment: true,
        hasDeck: true,
      }),
    ])
  })

  it("preserves canonical class and module publication visibility", () => {
    const metadata = buildModuleGroupMetaById([
      {
        id: "draft-class",
        published: false,
        title: "Draft Class",
        description: null,
        slug: "draft-class",
        modules: [
          {
            id: "draft-module",
            published: true,
            slug: "draft",
            title: "Draft",
            description: null,
            href: "/accelerator/class/draft-class/module/1",
            status: "not_started",
            index: 1,
            hasNotes: false,
          },
        ],
      },
    ])

    expect(metadata.get("draft-module")).toEqual({
      title: "Draft Class",
      order: 0,
      published: false,
    })
  })

  it("detects the canonical organization setup module id", () => {
    expect(
      isOrganizationSetupTimelineModule({
        roadmapModule: {
          id: "workspace-onboarding-organization-setup",
          slug: "organization-setup",
          title: "Organization setup",
          href: "/accelerator/class/formation/module/1",
        },
      })
    ).toBe(true)
  })

  it("detects organization setup modules even when ids are UUID-backed", () => {
    expect(
      isOrganizationSetupTimelineModule({
        roadmapModule: {
          id: "ded5d852-1444-40c4-a62f-d2f83a93ce69",
          slug: "workspace-setup",
          title: "Workspace setup",
          href: "/accelerator/class/formation/module/0",
        },
      })
    ).toBe(true)
  })

  it("does not classify regular Formation modules as organization setup", () => {
    expect(
      isOrganizationSetupTimelineModule({
        roadmapModule: {
          id: "a-module-id",
          slug: "naming-your-nfp",
          title: "Naming your NFP",
          href: "/accelerator/class/formation/module/1",
        },
      })
    ).toBe(false)
  })

  it("adds community resource links to the Introduction module", () => {
    expect(
      resolveWorkspaceAcceleratorSupplementalResources({
        slug: "intro-idea-to-impact-accelerator",
        title: "Introduction: Idea to Impact Accelerator",
      }).map((resource) => resource.title)
    ).toEqual(["WhatsApp community", "Discord community", "Find organizations"])
  })

  it("adds Bizee and IRS resources to the relevant Formation modules", () => {
    expect(
      resolveWorkspaceAcceleratorSupplementalResources({
        slug: "nfp-registration",
      })
    ).toEqual([
      expect.objectContaining({
        title: "Bizee EIN registration support",
        url: "https://bizee.com",
      }),
    ])

    expect(
      resolveWorkspaceAcceleratorSupplementalResources({
        slug: "filing-1023",
      }).map((resource) => resource.url)
    ).toEqual([
      "https://www.irs.gov/uac/about-form-1023",
      "https://www.irs.gov/forms-pubs/about-form-1023-ez",
    ])
  })
})
