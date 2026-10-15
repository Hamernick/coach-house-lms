import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { GuestDraftController } from "@/features/fiscal-sponsorship/lib/guest-draft-controller"

const hooks = vi.hoisted(() => ({ cursor: 0, slots: [] as unknown[] }))
vi.mock("react", () => ({
  useRef: (current: unknown) => { const index = hooks.cursor++; return hooks.slots[index] ??= { current } },
  useState: (initial: unknown) => {
    const index = hooks.cursor++
    if (!(index in hooks.slots)) hooks.slots[index] = initial
    return [hooks.slots[index], (value: unknown) => { hooks.slots[index] = value }]
  },
}))
vi.mock("@/features/fiscal-sponsorship/lib/guest-submission-input", () => ({
  guestFieldName: (path: string[]) => path.at(-1),
  guestSubmissionInput: (_draft: unknown, captchaToken: string) => captchaToken
    ? { success: true, data: { captchaToken, application: { projectName: "Preserved answers" } } }
    : { success: false, error: { issues: [{ path: ["captchaToken"], code: "custom", message: "Complete verification." }] } },
}))
import { usePublicFiscalSubmission } from "@/features/fiscal-sponsorship/components/use-public-fiscal-submission"

function setup() {
  const flush = vi.fn(async () => true)
  const acceptSubmission = vi.fn()
  const controller = { getSnapshot: () => ({ draft: {} }), flush, acceptSubmission, expireSession: vi.fn() } as unknown as GuestDraftController
  const TestSubmission = () => { hooks.cursor = 0; return usePublicFiscalSubmission(controller) }
  const resetCaptcha = vi.fn()
  let hook = TestSubmission()
  hook.captchaRef.current = { resetCaptcha } as unknown as NonNullable<typeof hook.captchaRef.current>
  hook.setCaptchaToken("fresh-token")
  hook = TestSubmission()
  return { hook, render: TestSubmission, flush, acceptSubmission, resetCaptcha }
}
beforeEach(() => { hooks.cursor = 0; hooks.slots = []; vi.stubGlobal("fetch", vi.fn()) })
afterEach(() => { vi.unstubAllGlobals() })

describe("fiscal submission challenge and acknowledgment retries", () => {
  it("does not send a token that expired while the draft was saving", async () => {
    const test = setup()
    let saved!: (value: boolean) => void
    test.flush.mockImplementation(() => new Promise<boolean>(resolve => { saved = resolve }))
    const submitting = test.hook.submit()
    test.hook.setCaptchaToken("")
    saved(true); await submitting
    expect(fetch).not.toHaveBeenCalled()
    expect(test.render()).toMatchObject({ working: false, uncertain: false, errors: { captchaToken: expect.any(String) } })
  })
  it("uses a replacement token completed during the draft save", async () => {
    const test = setup()
    test.flush.mockImplementation(async () => { test.hook.setCaptchaToken("replacement-token"); return true })
    vi.mocked(fetch).mockResolvedValue(Response.json({ error: "Check answers." }, { status: 400 }))
    await test.hook.submit()
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string).captchaToken).toBe("replacement-token")
  })
  it("releases editing and shows a definite provider failure without pretending a submission is pending", async () => {
    const test = setup()
    vi.mocked(fetch).mockResolvedValue(Response.json({ code: "captcha_unavailable", error: "Verification is unavailable on our side." }, { status: 503 }))
    await test.hook.submit()
    expect(test.render()).toMatchObject({ working: false, uncertain: false, captchaToken: "", message: "Verification is unavailable on our side." })
    expect(test.resetCaptcha).toHaveBeenCalledOnce()
    expect(test.acceptSubmission).not.toHaveBeenCalled()
  })
  it("uses a newly completed challenge after a definite token rejection", async () => {
    const test = setup()
    vi.mocked(fetch).mockImplementation(async () => Response.json({ code: "captcha_rejected", error: "Verify again." }, { status: 400 }))
    await test.hook.submit()
    test.render().setCaptchaToken("new-token")
    await test.render().submit()
    const bodies = vi.mocked(fetch).mock.calls.map(([,init]) => JSON.parse(init!.body as string))
    expect(bodies.map(body => body.captchaToken)).toEqual(["fresh-token", "new-token"])
    expect(bodies[1].application).toEqual(bodies[0].application)
  })
  it("preserves the exact request for an uncertain write and accepts its receipt on retry", async () => {
    const test = setup()
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ error: "Unknown write result." }, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ ok: true, reference: "20000000-0000-4000-8000-000000000001" }))
    await test.hook.submit()
    expect(test.render().uncertain).toBe(true)
    test.render().setCaptchaToken("")
    await test.render().submit()
    expect(vi.mocked(fetch).mock.calls[1][1]!.body).toBe(vi.mocked(fetch).mock.calls[0][1]!.body)
    expect(test.flush).toHaveBeenCalledOnce()
    expect(test.acceptSubmission).toHaveBeenCalledOnce()
    expect(test.render().uncertain).toBe(false)
  })
})
