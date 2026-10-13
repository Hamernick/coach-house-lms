import { vi } from "vitest"

export class RedirectError extends Error {
  constructor(public destination: string) {
    super(`redirect:${destination}`)
  }
}

export const redirectMock = vi.fn((destination: string) => {
  throw new RedirectError(destination)
})

export const revalidatePathMock = vi.fn()

export const headersMock = vi.fn(async () => ({
  get: (name: string): string | undefined => {
    if (name.toLowerCase() === "origin") {
      return "https://example.test"
    }
    return undefined
  },
}))

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}))

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}))

vi.mock("next/headers", () => ({
  headers: headersMock,
}))

export const createSupabaseServerClientMock = vi.fn()
export const createSupabaseServerClientServerMock = vi.fn()

vi.mock("@/lib/supabase", async () => {
  const actual = await vi.importActual<typeof import("@/lib/supabase")>("@/lib/supabase")
  return {
    ...actual,
    createSupabaseServerClient: createSupabaseServerClientMock,
  }
})

vi.mock("@/lib/supabase/server", async () => {
  const actual = await vi.importActual<typeof import("@/lib/supabase/server")>("@/lib/supabase/server")
  return {
    ...actual,
    createSupabaseServerClient: createSupabaseServerClientServerMock,
  }
})

export const requireAdminMock = vi.fn()

vi.mock("@/lib/admin/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin/auth")>("@/lib/admin/auth")
  return {
    ...actual,
    requireAdmin: requireAdminMock,
  }
})

export const loggerInfoMock = vi.fn()
export const loggerErrorMock = vi.fn()
export const loggerWarnMock = vi.fn()

vi.mock("@/lib/logger", () => ({
  logger: {
    info: loggerInfoMock,
    error: loggerErrorMock,
    warn: loggerWarnMock,
    debug: vi.fn(),
  },
  logHandledError: loggerErrorMock,
}))

export const stripeConstructorMock = vi.fn()
export const stripeCheckoutCreateMock = vi.fn()
export const stripeCheckoutRetrieveMock = vi.fn()
export const stripeBillingPortalCreateMock = vi.fn()

class StripeMock {
  checkout = {
    sessions: {
      create: stripeCheckoutCreateMock,
      retrieve: stripeCheckoutRetrieveMock,
    },
  }
  billingPortal = {
    sessions: {
      create: stripeBillingPortalCreateMock,
    },
  }

  constructor(...args: unknown[]) {
    stripeConstructorMock(...args)
  }
}

vi.mock("stripe", () => ({
  default: StripeMock,
}))

export function resetTestMocks() {
  redirectMock.mockClear()
  revalidatePathMock.mockClear()
  headersMock.mockClear()
  createSupabaseServerClientMock.mockReset()
  createSupabaseServerClientServerMock.mockReset()
  requireAdminMock.mockReset()
  loggerInfoMock.mockClear()
  loggerErrorMock.mockClear()
  loggerWarnMock.mockClear()
  stripeConstructorMock.mockClear()
  stripeCheckoutCreateMock.mockClear()
  stripeCheckoutRetrieveMock.mockClear()
  stripeBillingPortalCreateMock.mockClear()
}

export function captureRedirect(fn: () => Promise<unknown> | unknown) {
  return Promise.resolve(fn()).then(
    () => {
      throw new Error("Expected redirect but none occurred")
    },
    (error) => {
      if (error instanceof RedirectError) {
        return error.destination
      }
      throw error
    }
  )
}
