import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
const mock = vi.hoisted(() => ({
  user: vi.fn(),
  organization: vi.fn(),
  parse: vi.fn(),
  client: vi.fn(),
}))
vi.mock("server-only", () => ({}))
vi.mock("openai", () => ({
  default: class {
    responses = { parse: mock.parse }
    constructor(options: unknown) {
      mock.client(options)
    }
  },
}))
vi.mock("@/lib/supabase/route", () => ({
  createSupabaseRouteHandlerClient: () => ({ auth: { getUser: mock.user } }),
}))
vi.mock("@/lib/organization/active-org", () => ({
  resolveActiveOrganization: mock.organization,
  canEditOrganization: (role: string) =>
    ["owner", "admin", "staff"].includes(role),
}))
import { generateObjectivePlan } from "@/features/workspace-objective-planner/actions"
const draft = {
  decision: null,
  title: "Train neighbors",
  summary: "Build skills",
  steps: ["Confirm site"],
  tools: [],
  channels: [],
}
const request = (
  body: unknown = { objective: "Train neighbors", notes: "" },
  origin = "http://localhost"
) =>
  new NextRequest("http://localhost/api/workspace/objectives/plan", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  })
let sequence = 0
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("WORKSPACE_OBJECTIVE_AI_ENABLED", "true")
  vi.stubEnv("WORKSPACE_OBJECTIVE_AI_MODEL", "test-model")
  vi.stubEnv("OPENAI_API_KEY", "fake-test-key")
  mock.user.mockResolvedValue({ data: { user: { id: "user" } }, error: null })
  mock.organization.mockResolvedValue({
    orgId: `org-${sequence++}`,
    role: "owner",
  })
  mock.parse.mockResolvedValue({ status: "completed", output_parsed: draft })
})
afterEach(() => vi.unstubAllEnvs())
describe("objective AI draft boundary", () => {
  it("rejects cross-origin and anonymous requests before calling AI", async () => {
    expect(
      (await generateObjectivePlan(request(undefined, "https://evil.example")))
        .status
    ).toBe(403)
    mock.user.mockResolvedValue({ data: { user: null } })
    expect((await generateObjectivePlan(request())).status).toBe(401)
    expect(mock.parse).not.toHaveBeenCalled()
  })
  it.each(["board", "member"])("denies drafting for %s", async (role) => {
    mock.organization.mockResolvedValue({ orgId: "view-only", role })
    expect((await generateObjectivePlan(request())).status).toBe(403)
    expect(mock.parse).not.toHaveBeenCalled()
  })
  it("stays closed without pilot configuration and in production", async () => {
    vi.stubEnv("WORKSPACE_OBJECTIVE_AI_ENABLED", "false")
    expect((await generateObjectivePlan(request())).status).toBe(503)
    vi.stubEnv("WORKSPACE_OBJECTIVE_AI_ENABLED", "true")
    vi.stubEnv("NODE_ENV", "production")
    expect((await generateObjectivePlan(request())).status).toBe(503)
    expect(mock.client).not.toHaveBeenCalled()
  })
  it("validates input shape and stream size before spending tokens", async () => {
    expect(
      (await generateObjectivePlan(request({ objective: "", notes: "" })))
        .status
    ).toBe(400)
    expect(
      (
        await generateObjectivePlan(
          request({
            objective: "Test",
            notes: "",
            fileUrl: "https://private.example",
          })
        )
      ).status
    ).toBe(400)
    expect(
      (
        await generateObjectivePlan(
          request({ objective: "Test", notes: "x".repeat(21000) })
        )
      ).status
    ).toBe(413)
    expect(mock.parse).not.toHaveBeenCalled()
  })
  it("returns reviewable data with bounded nonstored requests and no tools", async () => {
    const response = await generateObjectivePlan(request())
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ draft })
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(mock.client).toHaveBeenCalledWith(
      expect.objectContaining({ timeout: 25000, maxRetries: 0 })
    )
    const options = mock.parse.mock.calls[0][0]
    expect(options).toMatchObject({
      model: "test-model",
      store: false,
      max_output_tokens: 2400,
    })
    expect(options).not.toHaveProperty("tools")
    expect(JSON.parse(options.input)).toEqual({
      objective: "Train neighbors",
      notes: "",
    })
  })
  it.each([null, { ...draft, steps: Array(13).fill("Step") }])(
    "rejects refused or invalid output",
    async (output) => {
      mock.parse.mockResolvedValue({
        status: "completed",
        output_parsed: output,
      })
      expect((await generateObjectivePlan(request())).status).toBe(502)
    }
  )
  it("hides provider errors and never presents a failed call as a draft", async () => {
    mock.parse.mockRejectedValue(new Error("private-provider-detail"))
    const response = await generateObjectivePlan(request())
    expect(response.status).toBe(502)
    expect(await response.text()).not.toContain("private-provider-detail")
  })
  it("reserves a maximum of five pilot attempts including failures", async () => {
    mock.parse.mockRejectedValue(new Error("failed"))
    for (let i = 0; i < 5; i++)
      expect((await generateObjectivePlan(request())).status).toBe(502)
    expect((await generateObjectivePlan(request())).status).toBe(429)
    expect(mock.parse).toHaveBeenCalledTimes(5)
  })
})
