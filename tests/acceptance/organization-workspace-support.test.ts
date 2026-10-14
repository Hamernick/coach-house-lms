import { beforeEach, describe, expect, it, vi } from "vitest"
import { createOrganizationScopedFetch, mergeSupportSearchResults } from "@/features/organization-workspace-support/lib"

const mocks = vi.hoisted(() => ({ scope: vi.fn(), cookie: vi.fn(), rpc: vi.fn() }))
vi.mock("@/lib/feature-flags", () => ({ organizationWorkspaceSupportEnabled: true }))
vi.mock("@/server/organization/request-scope", () => ({ readOrganizationRequestScope: mocks.scope }))
vi.mock("@/lib/organization/active-org-cookie", () => ({ readActiveOrganizationCookie: mocks.cookie }))
import { resolveActiveOrganization } from "@/lib/organization/active-org"

function client(memberships: Array<{ org_id: string; role: string }> = []) {
  return { rpc: mocks.rpc, from: (table: string) => ({ select: () => ({ eq: () => ({
    returns: async () => ({ data: memberships }),
    maybeSingle: async () => ({ data: table === "organizations" ? { user_id: "support-org" } : null }),
  }) }) }) }
}

describe("workspace support search and scope", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.scope.mockResolvedValue({ explicit: null, support: null })
    mocks.cookie.mockResolvedValue("member-org")
    mocks.rpc.mockResolvedValue({ data: false, error: null })
  })
  it("keeps the default membership list small and does not retain old search results", () => {
    const memberships = [{ orgId: "mine", name: "My organization" }, { orgId: "temporary", name: "Temporary workspace" }]
    const results = [{ orgId: "other", name: "Other organization" }]
    expect(mergeSupportSearchResults(memberships, results, "")).toEqual(memberships)
    expect(mergeSupportSearchResults(memberships, results, "Other")).toEqual(results)
    expect(mergeSupportSearchResults(memberships, results, "")).not.toContain(results[0])
  })
  it("deduplicates membership and admin search results", () => {
    const member = { orgId: "one", name: "One" }
    expect(mergeSupportSearchResults([member], [{ ...member }], "One")).toEqual([member])
  })
  it("allows only a live explicit grant to resolve a support workspace", async () => {
    mocks.cookie.mockResolvedValue("support-org")
    mocks.scope.mockResolvedValue({ explicit: null, support: "support-org" })
    mocks.rpc.mockResolvedValue({ data: true, error: null })
    await expect(resolveActiveOrganization(client() as never, "actor")).resolves.toEqual({ orgId: "support-org", role: "admin", supportAccess: true })
    mocks.rpc.mockResolvedValue({ data: false, error: null })
    await expect(resolveActiveOrganization(client() as never, "actor")).rejects.toThrow("revoked")
  })
  it("fails closed on an authorization lookup error", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "network" } })
    await expect(resolveActiveOrganization(client() as never, "actor")).rejects.toThrow("verify")
  })
  it("retains the old tab target after another tab changes the cookie", async () => {
    mocks.scope.mockResolvedValue({ explicit: "old-org", support: "new-org" })
    mocks.cookie.mockResolvedValue("new-org")
    await expect(resolveActiveOrganization(client([{ org_id: "old-org", role: "staff" }]) as never, "actor")).resolves.toEqual({ orgId: "old-org", role: "staff" })
  })
  it("does not silently redirect a revoked explicit target into the actor's own workspace", async () => {
    mocks.scope.mockResolvedValue({ explicit: "revoked-org", support: null })
    await expect(resolveActiveOrganization(client() as never, "actor")).rejects.toThrow("no longer have access")
  })
  it("rejects an unscoped support mutation even after the support cookie expires", async () => {
    mocks.scope.mockResolvedValue({ explicit: null, support: null, method: "POST" })
    mocks.cookie.mockResolvedValue("support-org")
    mocks.rpc.mockResolvedValue({ data: true, error: null })
    await expect(resolveActiveOrganization(client() as never, "actor")).rejects.toThrow("context is missing")
  })
  it("lets a fresh page return to the actor's own workspace after revocation", async () => {
    mocks.scope.mockResolvedValue({ explicit: null, support: "support-org", supportRequested: true, method: "GET" })
    mocks.cookie.mockResolvedValue("support-org")
    await expect(resolveActiveOrganization(client() as never, "actor")).resolves.toEqual({ orgId: "actor", role: "owner" })
  })
  it("pins same-origin fetch requests without leaking the scope header to providers", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response())
    const scoped = createOrganizationScopedFetch(fetcher, "old-org", "http://localhost:3124/workspace")
    await scoped("/workspace", { method: "POST", headers: { "next-action": "save" }, body: "draft" })
    const [, init] = fetcher.mock.calls[0]
    expect(init.method).toBe("POST")
    expect(init.body).toBe("draft")
    expect(init.headers.get("next-action")).toBe("save")
    expect(init.headers.get("x-coach-house-organization-id")).toBe("old-org")
    await scoped("https://provider.example/upload", { method: "POST" })
    expect(fetcher.mock.calls[1][1]).toEqual({ method: "POST" })
  })
  it("preserves Request headers and uses the tab target over a stale supplied scope", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response())
    const scoped = createOrganizationScopedFetch(fetcher, "current", "https://coachhouse.app/workspace")
    const request = new Request("https://coachhouse.app/api/save", { method: "POST", headers: { "content-type": "application/json", "x-coach-house-organization-id": "stale" } })
    await scoped(request)
    expect(fetcher.mock.calls[0][0]).toBe(request)
    expect(fetcher.mock.calls[0][1].headers.get("content-type")).toBe("application/json")
    expect(fetcher.mock.calls[0][1].headers.get("x-coach-house-organization-id")).toBe("current")
  })
})
