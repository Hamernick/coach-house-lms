import { describe, expect, it, vi } from "vitest"

import {
  addActiveOrganizationResults,
  attachOrganizationImages,
} from "@/app/api/search/_lib/query-sources/organization"
import type { SearchResult } from "@/lib/search/types"

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function createQueryBuilder<T>(result: Promise<T>) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    returns: vi.fn(() => result),
    maybeSingle: vi.fn(() => result),
  }
}

describe("global search query source concurrency", () => {
  it("loads active-organization programs and profile concurrently", async () => {
    const programs = createDeferred<{
      data: Array<{
        id: string
        title: string
        subtitle: string | null
        status_label: string | null
      }>
    }>()
    const organization = createDeferred<{
      data: { profile: Record<string, unknown> } | null
    }>()
    const from = vi.fn((table: string) => {
      if (table === "programs") return createQueryBuilder(programs.promise)
      if (table === "organizations") {
        return createQueryBuilder(organization.promise)
      }
      throw new Error(`Unexpected table: ${table}`)
    })
    const results: SearchResult[] = []

    const pending = addActiveOrganizationResults({
      supabase: { from } as never,
      orgId: "org-1",
      tokens: ["youth"],
      pushResult: (result) => results.push(result),
    })

    expect(from.mock.calls.map(([table]) => table)).toEqual([
      "programs",
      "organizations",
    ])

    programs.resolve({
      data: [
        {
          id: "program-1",
          title: "Youth services",
          subtitle: null,
          status_label: null,
        },
      ],
    })
    organization.resolve({
      data: { profile: { name: "Youth House" } },
    })
    await pending

    expect(results.map((result) => result.id)).toEqual([
      "program:program-1",
      "org:org-1",
    ])
  })

  it("loads self and community logos concurrently", async () => {
    const self = createDeferred<{
      data: { profile: Record<string, unknown> } | null
    }>()
    const community = createDeferred<{
      data: Array<{
        public_slug: string | null
        profile: Record<string, unknown> | null
      }>
    }>()
    const from = vi
      .fn()
      .mockImplementationOnce(() => createQueryBuilder(self.promise))
      .mockImplementationOnce(() => createQueryBuilder(community.promise))

    const pending = attachOrganizationImages({
      supabase: { from } as never,
      orgId: "org-1",
      results: [
        {
          id: "org:org-1",
          label: "My organization",
          href: "/workspace?view=editor&tab=company",
          group: "My organization",
        },
        {
          id: "community-1",
          label: "Neighbor",
          href: "/neighbor",
          group: "Community",
        },
      ],
    })

    expect(from).toHaveBeenCalledTimes(2)

    self.resolve({ data: { profile: { logoUrl: "/self.png" } } })
    community.resolve({
      data: [
        {
          public_slug: "neighbor",
          profile: { logoUrl: "/neighbor.png" },
        },
      ],
    })

    await expect(pending).resolves.toEqual([
      expect.objectContaining({ id: "org:org-1", image: "/self.png" }),
      expect.objectContaining({
        id: "community-1",
        image: "/neighbor.png",
      }),
    ])
  })
})
