import { readFileSync } from "node:fs"
import { join } from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { resolveAuthenticatedAppContextMock } = vi.hoisted(() => ({
  resolveAuthenticatedAppContextMock: vi.fn(),
}))

vi.mock("@/lib/auth/request-context", () => ({
  resolveAuthenticatedAppContext: resolveAuthenticatedAppContextMock,
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { updateWorkspaceFinanceAccess } from "@/actions/workspace-finance-access"
import { loadOrganizationFinanceAccess } from "@/features/workspace-finance/server/access"

const MEMBER_ID = "11111111-1111-4111-8111-111111111111"

function resolvedBuilder<T>(result: T) {
  const builder = {
    delete: vi.fn(),
    eq: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    order: vi.fn(),
    returns: vi.fn(),
    select: vi.fn(),
    then: (resolve: (value: T) => unknown) =>
      Promise.resolve(result).then(resolve),
  }
  builder.delete.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.limit.mockReturnValue(builder)
  builder.order.mockReturnValue(builder)
  builder.select.mockReturnValue(builder)
  return builder
}

function createActionContext({ role = "owner" }: { role?: string } = {}) {
  const membership = resolvedBuilder({
    data: { member_id: MEMBER_ID },
    error: null,
  })
  membership.maybeSingle.mockResolvedValue({
    data: { member_id: MEMBER_ID },
    error: null,
  })
  const access = resolvedBuilder({ error: null })
  const upsert = vi.fn().mockResolvedValue({ error: null })
  const from = vi.fn((table: string) => {
    if (table === "organization_memberships") return membership
    if (table === "organization_finance_access") {
      return { ...access, upsert }
    }
    throw new Error(`Unexpected table ${table}`)
  })

  return {
    context: {
      activeOrg: { orgId: "owner", role },
      supabase: { from },
      user: { id: "owner" },
    },
    access,
    membership,
    upsert,
  }
}

describe("workspace Finance board access", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("denies invalid targets and non-owner actors before mutation", async () => {
    await expect(
      updateWorkspaceFinanceAccess({ accessLevel: "viewer", memberId: "bad" })
    ).resolves.toEqual({
      error: "Choose a valid board member and access level.",
    })
    expect(resolveAuthenticatedAppContextMock).not.toHaveBeenCalled()

    const { context, upsert } = createActionContext({ role: "board" })
    resolveAuthenticatedAppContextMock.mockResolvedValue(context)
    await expect(
      updateWorkspaceFinanceAccess({
        accessLevel: "viewer",
        memberId: MEMBER_ID,
      })
    ).resolves.toEqual({
      error: "Only the organization owner can share Finance.",
    })
    expect(upsert).not.toHaveBeenCalled()
  })

  it("requires a current board membership", async () => {
    const { context, membership, upsert } = createActionContext()
    membership.maybeSingle.mockResolvedValue({ data: null, error: null })
    resolveAuthenticatedAppContextMock.mockResolvedValue(context)

    await expect(
      updateWorkspaceFinanceAccess({
        accessLevel: "manager",
        memberId: MEMBER_ID,
      })
    ).resolves.toEqual({ error: "Choose a current board member." })
    expect(upsert).not.toHaveBeenCalled()
  })

  it("grants viewer or manager access through the existing scoped table", async () => {
    const { context, upsert } = createActionContext()
    resolveAuthenticatedAppContextMock.mockResolvedValue(context)

    await expect(
      updateWorkspaceFinanceAccess({
        accessLevel: "manager",
        memberId: MEMBER_ID,
      })
    ).resolves.toEqual({ accessLevel: "manager", ok: true })
    expect(upsert).toHaveBeenCalledWith(
      {
        access_level: "manager",
        granted_by: "owner",
        member_id: MEMBER_ID,
        org_id: "owner",
      },
      { onConflict: "org_id,member_id" }
    )
  })

  it("returns a bounded error when a grant cannot be saved", async () => {
    const { context, upsert } = createActionContext()
    upsert.mockResolvedValue({ error: { code: "42501" } })
    resolveAuthenticatedAppContextMock.mockResolvedValue(context)

    await expect(
      updateWorkspaceFinanceAccess({
        accessLevel: "viewer",
        memberId: MEMBER_ID,
      })
    ).resolves.toEqual({ error: "Unable to update Finance access." })
  })

  it("revokes access through an organization and member scoped delete", async () => {
    const { access, context } = createActionContext()
    resolveAuthenticatedAppContextMock.mockResolvedValue(context)

    await expect(
      updateWorkspaceFinanceAccess({
        accessLevel: null,
        memberId: MEMBER_ID,
      })
    ).resolves.toEqual({ accessLevel: null, ok: true })
    expect(access.delete).toHaveBeenCalledOnce()
    expect(access.eq).toHaveBeenNthCalledWith(1, "org_id", "owner")
    expect(access.eq).toHaveBeenNthCalledWith(2, "member_id", MEMBER_ID)
  })

  it("loads only board members and reconciles their current access", async () => {
    const memberships = resolvedBuilder({ data: [], error: null })
    memberships.returns.mockResolvedValue({
      data: [{ member_email: "board@example.org", member_id: MEMBER_ID }],
      error: null,
    })
    const access = resolvedBuilder({ data: [], error: null })
    access.returns.mockResolvedValue({
      data: [{ access_level: "viewer", member_id: MEMBER_ID }],
      error: null,
    })
    const supabase = {
      from: vi.fn((table: string) =>
        table === "organization_memberships" ? memberships : access
      ),
    }

    await expect(
      loadOrganizationFinanceAccess({
        canManage: true,
        orgId: "owner",
        supabase: supabase as never,
      })
    ).resolves.toEqual({
      canManage: true,
      members: [
        {
          accessLevel: "viewer",
          email: "board@example.org",
          memberId: MEMBER_ID,
        },
      ],
      state: "ready",
    })
    expect(memberships.eq).toHaveBeenCalledWith("role", "board")
  })

  it("returns a recoverable state when board access cannot load", async () => {
    const memberships = resolvedBuilder({ data: [], error: null })
    memberships.returns.mockResolvedValue({
      data: null,
      error: { code: "42501" },
    })
    const access = resolvedBuilder({ data: [], error: null })
    access.returns.mockResolvedValue({ data: [], error: null })
    const supabase = {
      from: vi.fn((table: string) =>
        table === "organization_memberships" ? memberships : access
      ),
    }

    await expect(
      loadOrganizationFinanceAccess({
        canManage: true,
        orgId: "owner",
        supabase: supabase as never,
      })
    ).resolves.toEqual({ canManage: true, members: [], state: "error" })
  })

  it("keeps the owner control compact and confirms revocation", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/workspace-finance/components/workspace-finance-access-popover.tsx"
      ),
      "utf8"
    )

    expect(source).toContain('aria-label="Share Finance with board members"')
    expect(source).toContain("Revoke Finance access?")
    expect(source).toContain("No board members yet.")
    expect(source).toContain('href="/people"')
    expect(source).toContain('initialAccess.state === "error"')
  })
})
