import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const {
  createSupabaseRouteHandlerClientMock,
  resolveActiveOrganizationMock,
  resolveRoadmapSectionsMock,
  listUserModuleNotesIndexMock,
} = vi.hoisted(() => ({
  createSupabaseRouteHandlerClientMock: vi.fn(),
  resolveActiveOrganizationMock: vi.fn(),
  resolveRoadmapSectionsMock: vi.fn(),
  listUserModuleNotesIndexMock: vi.fn(),
}))

vi.mock("@/lib/supabase/route", () => ({
  createSupabaseRouteHandlerClient: createSupabaseRouteHandlerClientMock,
}))

vi.mock("@/lib/organization/active-org", () => ({
  resolveActiveOrganization: resolveActiveOrganizationMock,
}))

vi.mock("@/lib/roadmap", () => ({
  resolveRoadmapSections: resolveRoadmapSectionsMock,
}))

vi.mock("@/lib/modules/notes-index", () => ({
  listUserModuleNotesIndex: listUserModuleNotesIndexMock,
}))

type SupabaseRouteStubOptions = {
  userId?: string | null
  profile?: Record<string, unknown> | null
}

function buildRouteSupabaseStub({
  userId = "user-1",
  profile = {},
}: SupabaseRouteStubOptions = {}) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: { profile },
    error: null,
  })
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn((table: string) => {
    if (table !== "organizations") {
      throw new Error(`Unexpected table: ${table}`)
    }
    return { select }
  })

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
    from,
  }

  return { supabase, calls: { from, select, eq, maybeSingle } }
}

function buildRequest(id: string) {
  return new NextRequest(
    `http://localhost/api/account/workspace-documents-index/item?id=${encodeURIComponent(id)}`,
  )
}

describe("workspace documents item route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolveActiveOrganizationMock.mockResolvedValue({ orgId: "org-1" })
    resolveRoadmapSectionsMock.mockReturnValue([])
    listUserModuleNotesIndexMock.mockResolvedValue([])
  })

  it("returns 401 when request is unauthenticated", async () => {
    const { supabase } = buildRouteSupabaseStub({ userId: null })
    createSupabaseRouteHandlerClientMock.mockReturnValue(supabase)

    const { GET } = await import("@/app/api/account/workspace-documents-index/item/route")
    const response = await GET(buildRequest("roadmap:origin_story"))

    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ error: "Unauthorized" })
  })

  it("returns sanitized roadmap html detail", async () => {
    const { supabase, calls } = buildRouteSupabaseStub({
      profile: { anything: true },
    })
    createSupabaseRouteHandlerClientMock.mockReturnValue(supabase)
    resolveRoadmapSectionsMock.mockReturnValue([
      {
        id: "origin_story",
        slug: "origin-story",
        title: "Origin Story",
        subtitle: "How it started",
        content:
          "<p><strong>Mission</strong> first.</p><script>alert('xss')</script>",
        lastUpdated: "2026-03-03T12:00:00.000Z",
      },
    ])

    const { GET } = await import("@/app/api/account/workspace-documents-index/item/route")
    const response = await GET(buildRequest("roadmap:origin-story"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(resolveActiveOrganizationMock).toHaveBeenCalledTimes(1)
    expect(calls.from).toHaveBeenCalledWith("organizations")
    expect(payload.detail).toMatchObject({
      id: "roadmap:origin-story",
      source: "roadmap",
      previewType: "roadmap_html",
      title: "Origin Story",
      subtitle: "How it started",
      updatedAt: "2026-03-03T12:00:00.000Z",
    })
    expect(payload.detail.contentHtml).toContain("<strong>Mission</strong>")
    expect(payload.detail.contentHtml).not.toContain("<script>")
  })

  it("returns note markdown detail", async () => {
    const { supabase } = buildRouteSupabaseStub()
    createSupabaseRouteHandlerClientMock.mockReturnValue(supabase)
    listUserModuleNotesIndexMock.mockResolvedValue([
      {
        moduleId: "mod-42",
        moduleTitle: "Budget Basics",
        classTitle: "Accelerator Core",
        updatedAt: "2026-03-02T18:00:00.000Z",
        content: "## Key Notes\n- Keep runway visible",
        href: "/accelerator/class/foundation/module/3?from=documents",
      },
    ])

    const { GET } = await import("@/app/api/account/workspace-documents-index/item/route")
    const response = await GET(buildRequest("note:mod-42"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(listUserModuleNotesIndexMock).toHaveBeenCalledTimes(1)
    expect(payload.detail).toMatchObject({
      id: "note:mod-42",
      source: "note",
      previewType: "markdown",
      title: "Budget Basics notes",
      subtitle: "Accelerator Core · Accelerator",
      contentMarkdown: "## Key Notes\n- Keep runway visible",
    })
  })

  it("returns 400 for unsupported id type", async () => {
    const { supabase } = buildRouteSupabaseStub()
    createSupabaseRouteHandlerClientMock.mockReturnValue(supabase)

    const { GET } = await import("@/app/api/account/workspace-documents-index/item/route")
    const response = await GET(buildRequest("upload:verification-letter"))

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      error: "Unsupported item type.",
    })
  })
})
