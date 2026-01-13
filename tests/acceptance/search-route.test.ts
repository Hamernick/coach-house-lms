import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET } from "@/app/api/search/route"
import { fetchSidebarTree } from "@/lib/academy"
import { createSupabaseServerClientMock, resetTestMocks } from "./test-utils"

vi.mock("@/lib/academy", () => ({
  fetchSidebarTree: vi.fn(),
}))

vi.mock("@/lib/modules", () => ({
  parseAssignmentFields: vi.fn(() => []),
}))

vi.mock("@/lib/roadmap", () => ({
  resolveRoadmapSections: vi.fn(() => []),
}))

type RpcRow = {
  id: string
  label: string
  subtitle: string | null
  href: string
  group_name: string
  rank: number | null
}

function buildSupabaseStub({ rpcData, rpcError }: { rpcData?: RpcRow[]; rpcError?: unknown } = {}) {
  const returns = vi.fn().mockResolvedValue({ data: [], error: null })
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  const insert = vi.fn().mockResolvedValue({ error: null })

  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    returns,
    maybeSingle,
    insert,
  }

  const from = vi.fn(() => chain)

  const rpcReturns = vi.fn().mockResolvedValue({
    data: rpcData ?? [],
    error: rpcError ?? null,
  })

  const rpc = vi.fn(() => ({ returns: rpcReturns }))
  const auth = {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
  }

  return { supabaseStub: { auth, rpc, from }, rpcReturns }
}

const fetchSidebarTreeMock = vi.mocked(fetchSidebarTree)

describe("search route", () => {
  beforeEach(() => {
    resetTestMocks()
    fetchSidebarTreeMock.mockReset()
  })

  it("returns ranked results and filters session rows", async () => {
    const rpcData: RpcRow[] = [
      {
        id: "class:1",
        label: "Session A1 – Foundations",
        subtitle: "Class",
        href: "/accelerator/class/session-a1",
        group_name: "Classes",
        rank: 0.9,
      },
      {
        id: "module:2",
        label: "Theory of Change",
        subtitle: "Strategic Foundations",
        href: "/accelerator/class/strategic-foundations/module/1",
        group_name: "Modules",
        rank: 0.8,
      },
      {
        id: "community:1",
        label: "Open Source Org",
        subtitle: "Education",
        href: "/open-source-org",
        group_name: "Community",
        rank: 0.7,
      },
    ]

    const { supabaseStub, rpcReturns } = buildSupabaseStub({ rpcData })
    createSupabaseServerClientMock.mockResolvedValue(supabaseStub)

    const res = await GET(new Request("http://localhost/api/search?q=theory"))
    const json = await res.json()

    expect(supabaseStub.rpc).toHaveBeenCalledWith("search_global", expect.objectContaining({ p_query: "theory" }))
    expect(rpcReturns).toHaveBeenCalledTimes(1)
    expect(json.results).toEqual([
      {
        id: "module:2",
        label: "Theory of Change",
        subtitle: "Strategic Foundations",
        href: "/accelerator/class/strategic-foundations/module/1",
        group: "Modules",
      },
      {
        id: "community:1",
        label: "Open Source Org",
        subtitle: "Education",
        href: "/open-source-org",
        group: "Community",
      },
    ])
  })

  it("falls back to manual search when the RPC fails", async () => {
    const { supabaseStub } = buildSupabaseStub({ rpcError: { message: "missing function" } })
    createSupabaseServerClientMock.mockResolvedValue(supabaseStub)
    fetchSidebarTreeMock.mockResolvedValue([
      {
        id: "class-1",
        slug: "strategic-foundations",
        title: "Strategic Foundations",
        description: "Core skills",
        published: true,
        modules: [
          {
            id: "module-1",
            index: 1,
            title: "Org profile",
            description: "Basics",
            published: true,
          },
        ],
      },
    ])

    const res = await GET(new Request("http://localhost/api/search?q=strategic"))
    const json = await res.json()

    expect(fetchSidebarTreeMock).toHaveBeenCalled()
    expect(json.results.map((item: { id: string }) => item.id)).toEqual(["class-class-1", "module-module-1"])
  })
})
