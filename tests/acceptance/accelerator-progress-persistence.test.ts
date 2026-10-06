import { beforeEach, describe, expect, it, vi } from "vitest"
import { markModuleCompleteAction } from "@/app/actions/module-progress"
import { fetchAcceleratorProgressSummary, fetchAcceleratorProgressTotalsByUserId } from "@/lib/accelerator/progress"
import { createSupabaseServerClientServerMock, revalidatePathMock } from "./test-utils"

describe("durable accelerator progress", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("reports completion write failures and invalidates overviews only after success", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: "offline" } })
    createSupabaseServerClientServerMock.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "viewer" } }, error: null }) },
      from: () => ({ upsert }),
    })
    expect(await markModuleCompleteAction("lesson")).toHaveProperty("error")
    expect(revalidatePathMock).not.toHaveBeenCalled()
    upsert.mockResolvedValue({ error: null })
    expect(await markModuleCompleteAction("lesson")).toEqual({ ok: true })
    expect(upsert).toHaveBeenLastCalledWith(expect.objectContaining({ user_id: "viewer", module_id: "lesson", status: "completed" }), { onConflict: "user_id,module_id" })
    expect(revalidatePathMock).toHaveBeenCalledWith("/workspace", "layout")
    expect(revalidatePathMock).toHaveBeenCalledWith("/accelerator", "layout")
  })

  it("shows completed assignments despite an older in-progress row in both summaries", async () => {
    const rows: Record<string, unknown[]> = {
      module_progress: [{ user_id: "viewer", module_id: "lesson", status: "in_progress", notes: null }],
      assignment_submissions: [{ user_id: "viewer", module_id: "lesson", status: "accepted", answers: {} }],
      module_assignments: [{ module_id: "lesson", complete_on_submit: true, schema: { fields: [] } }],
    }
    const supabase = { from: (table: string) => {
      const query = { select: () => query, eq: () => query, in: () => query, returns: async () => ({ data: rows[table], error: null }) }
      return query
    } } as never
    const classes = [{ id: "class", slug: "formation", title: "Formation", description: null, published: true, modules: [{ id: "lesson", index: 1, title: "Start with your why", description: null, published: true }] }]
    const summary = await fetchAcceleratorProgressSummary({ supabase, classes, userId: "viewer", isAdmin: false })
    expect(summary.groups[0].modules[0].status).toBe("completed")
    expect(summary.completedModules).toBe(1)
    const totals = await fetchAcceleratorProgressTotalsByUserId({ supabase, classes, userIds: ["viewer"] })
    expect(totals.get("viewer")?.completedModules).toBe(1)
  })
})
