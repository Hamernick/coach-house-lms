import { beforeEach, describe, expect, it, vi } from "vitest"

import { POST as createModuleRoute } from "@/app/api/admin/classes/[id]/modules/route"
import {
  createSupabaseServerClientServerMock,
  revalidatePathMock,
  requireAdminMock,
  resetTestMocks,
} from "./test-utils"

describe("admin module management", () => {
  beforeEach(() => {
    resetTestMocks()
  })

  it("creates a new module with the next index and redirects to the editor", async () => {
    const insertedPayloads: unknown[] = []

    const selectAfterInsert = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: "module-new" }, error: null }),
    })

    const modulesTable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { idx: 2 }, error: null }),
      insert: vi.fn((payload: unknown) => {
        insertedPayloads.push(payload)
        return {
          select: selectAfterInsert,
        }
      }),
    }

    const supabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "admin-user" } } },
        }),
      },
      from: vi.fn(() => modulesTable),
    }

    requireAdminMock.mockResolvedValue({ supabase, userId: "admin-user" })
    createSupabaseServerClientServerMock.mockReturnValue(supabase)

    const form = new FormData()
    form.set("classId", "class-42")

    const response = await createModuleRoute(
      new Request("http://localhost/api/admin/classes/class-42/modules", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "class-42" }) },
    )
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload).toMatchObject({ moduleId: "module-new" })
    expect(modulesTable.maybeSingle).toHaveBeenCalled()
    expect(modulesTable.insert).toHaveBeenCalledTimes(1)
    expect(insertedPayloads[0]).toMatchObject({
      class_id: "class-42",
      idx: 3,
      is_published: false,
    })
    expect((insertedPayloads[0] as { slug: string }).slug).toMatch(/^module-[a-z0-9]{8}$/)
    const revalidatedTargets = revalidatePathMock.mock.calls.map((args) => args[0])
    expect(revalidatedTargets).toEqual(
      expect.arrayContaining(["/classes", "/training", "/accelerator", "/accelerator/roadmap"]),
    )
  })
})
