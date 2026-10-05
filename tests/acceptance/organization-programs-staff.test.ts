import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { resolveStaffProgramAccess } from "@/lib/programs/staff-access"
import { buildProgramUpdatePatch } from "@/lib/programs/update-patch"
import { updateProgramAction } from "@/actions/programs"
import { loadOrganizationPrograms } from "@/features/member-workspace/server/organization-programs"
import { POST } from "@/app/api/account/program-media/route"
import { ProjectDetailTabsList } from "@/features/member-workspace/components/projects/project-detail-tabs-list"
import { Tabs } from "@/features/platform-admin-dashboard/upstream/components/ui/tabs"

const mocks = vi.hoisted(() => ({ admin: vi.fn(), session: vi.fn(), scope: vi.fn(), audience: vi.fn(), active: vi.fn(), route: vi.fn(), capability: vi.fn() }))
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: mocks.admin }))
vi.mock("@/lib/auth", () => ({ requireServerSession: mocks.session }))
vi.mock("@/lib/admin/auth", () => ({ requirePlatformCapability: mocks.capability }))
vi.mock("@/lib/admin/organization-coach-scope", () => ({ loadOrganizationCoachActorScope: mocks.scope }))
vi.mock("@/lib/devtools/audience", () => ({ resolveProfileAudience: mocks.audience, resolveTesterMetadata: () => false }))
vi.mock("@/lib/organization/active-org", () => ({ resolveActiveOrganization: mocks.active, canEditOrganization: (role: string) => role === "owner" }))
vi.mock("@/lib/supabase/route", () => ({ createSupabaseRouteHandlerClient: mocks.route }))

const orgId = "00000000-0000-4000-8000-000000000001"
const otherOrgId = "00000000-0000-4000-8000-000000000002"
let read: ReturnType<typeof query>
let write: ReturnType<typeof query>
let db: { from: ReturnType<typeof vi.fn>; storage: { from: ReturnType<typeof vi.fn> } }
let media: { upload: ReturnType<typeof vi.fn>; getPublicUrl: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> }
function query(data: unknown) {
  return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data, error: null }), maybeSingle: vi.fn().mockResolvedValue({ data, error: null }) }
}
beforeEach(() => {
  vi.clearAllMocks()
  read = query({ image_url: null, wizard_snapshot: { futureKey: "keep", title: "Before" }, updated_at: "2026-10-03T12:00:00Z" })
  write = query({ id: "program-a" })
  media = { upload: vi.fn().mockResolvedValue({ error: null }), getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/image.png" } }), remove: vi.fn() }
  db = { from: vi.fn((table: string) => table === "programs" ? { select: vi.fn(() => read), update: vi.fn(() => write) } : query(null)), storage: { from: vi.fn(() => media) } }
  const sessionDb = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "coach" } }, error: null }) } }
  mocks.admin.mockReturnValue(db)
  mocks.session.mockResolvedValue({ supabase: sessionDb, session: { user: { id: "coach" } } })
  mocks.route.mockReturnValue(sessionDb)
  mocks.scope.mockResolvedValue({ mode: "assigned", organizationIds: new Set([orgId]) })
  mocks.audience.mockResolvedValue({ isAdmin: false, platformAccessLevel: "coach" })
  mocks.capability.mockResolvedValue({ userId: "coach", accessLevel: "coach" })
})

describe("organization program staff access", () => {
  it("denies non-staff and malformed org IDs before an admin client is created", async () => {
    expect(await resolveStaffProgramAccess({ organizationId: orgId, userId: "member", accessLevel: null })).toHaveProperty("error")
    expect(await resolveStaffProgramAccess({ organizationId: "invalid", userId: "coach", accessLevel: "coach" })).toHaveProperty("error")
    expect(mocks.admin).not.toHaveBeenCalled()
  })
  it("denies out-of-scope coaches without querying programs", async () => {
    expect(await updateProgramAction("program-a", { title: "No" }, otherOrgId)).toHaveProperty("error")
    await expect(loadOrganizationPrograms(otherOrgId)).rejects.toThrow("Unable to access")
    expect(db.from).not.toHaveBeenCalled()
    expect(mocks.active).not.toHaveBeenCalled()
  })
  it("loads private and published programs only for the selected organization", async () => {
    read.order.mockResolvedValue({ data: [{ id: "program-a", title: "Private program", is_public: false, location_type: "online", wizard_snapshot: { futureKey: true } }], error: null })
    expect(await loadOrganizationPrograms(orgId)).toEqual([expect.objectContaining({ id: "program-a", is_public: false, wizard_snapshot: { futureKey: true } })])
    expect(read.eq).toHaveBeenCalledWith("user_id", orgId)
    expect(mocks.active).not.toHaveBeenCalled()
  })
  it("updates the selected org through its scoped, version-checked program query", async () => {
    expect(await updateProgramAction("program-a", { title: "After", wizardSnapshot: { title: "After" } }, orgId)).toEqual({ ok: true })
    expect(read.eq).toHaveBeenCalledWith("user_id", orgId)
    expect(write.eq).toHaveBeenCalledWith("user_id", orgId)
    expect(write.eq).toHaveBeenCalledWith("id", "program-a")
    expect(write.eq).toHaveBeenCalledWith("updated_at", "2026-10-03T12:00:00Z")
    expect(mocks.active).not.toHaveBeenCalled()
  })
  it("does not write when the program belongs to a different organization", async () => {
    read.maybeSingle.mockResolvedValue({ data: null, error: null })
    expect(await updateProgramAction("foreign-program", { wizardSnapshot: { title: "No" } }, orgId)).toHaveProperty("error")
    expect(write.select).not.toHaveBeenCalled()
  })
  it("returns conflicts and read errors instead of reporting success", async () => {
    write.maybeSingle.mockResolvedValue({ data: null, error: null })
    expect(await updateProgramAction("program-a", { wizardSnapshot: { title: "After" } }, orgId)).toMatchObject({ conflict: true })
    read.order.mockResolvedValue({ data: null, error: { message: "Unavailable" } })
    await expect(loadOrganizationPrograms(orgId)).rejects.toThrow("Unable to load")
  })
  it("allows platform admins through the same organization filter", async () => {
    mocks.audience.mockResolvedValue({ isAdmin: true, platformAccessLevel: "developer" })
    mocks.scope.mockResolvedValue({ mode: "all" })
    expect(await updateProgramAction("program-a", { title: "After" }, otherOrgId)).toEqual({ ok: true })
    expect(write.eq).toHaveBeenCalledWith("user_id", otherOrgId)
  })
  it("uploads staff media into the selected org and denies other orgs", async () => {
    const request = (organizationId: string) => {
      const form = new FormData()
      form.set("organizationId", organizationId)
      form.set("file", new File(["image"], "image.png", { type: "image/png" }))
      return new NextRequest("http://localhost:3000/api/account/program-media", { method: "POST", body: form })
    }
    expect((await POST(request(otherOrgId))).status).toBe(403)
    expect(media.upload).not.toHaveBeenCalled()
    expect((await POST(request(orgId))).status).toBe(200)
    expect(media.upload).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`^${orgId}/cover/`)), expect.any(Buffer), { contentType: "image/png" })
    expect(mocks.active).not.toHaveBeenCalled()
  })
  it("only patches changed builder fields and supports reverting an edit", () => {
    const before = { title: "Before", endDate: null, wizardSnapshot: { title: "Before", updatedAt: "old", budgetUsd: 100 } }
    const after = { ...before, title: "After", wizardSnapshot: { ...before.wizardSnapshot, title: "After", updatedAt: "new" } }
    expect(buildProgramUpdatePatch(before, { ...before, wizardSnapshot: { ...before.wizardSnapshot, updatedAt: "new" } })).toEqual({})
    expect(buildProgramUpdatePatch(before, after)).toEqual({ title: "After", wizardSnapshot: { title: "After", updatedAt: "new" } })
    expect(buildProgramUpdatePatch(after, before)).toEqual({ title: "Before", wizardSnapshot: { title: "Before", updatedAt: "old" } })
  })
  it("shows a Programs tab only when the organization has programs", () => {
    const render = (hasPrograms: boolean) => renderToStaticMarkup(React.createElement(Tabs, { value: "overview" }, React.createElement(ProjectDetailTabsList, { hasPrograms, fiscalEnabled: false, canAdd: false, adding: false, onAddFiscal: () => {} })))
    expect(render(true)).toContain('>Programs</button>')
    expect(render(false)).not.toContain('>Programs</button>')
  })
})
