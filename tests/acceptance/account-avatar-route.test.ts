import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const {
  createSupabaseRouteHandlerClientMock,
  createSupabaseAdminClientMock,
  uploadAvatarWithUserMock,
  uploadAvatarAdminMock,
} = vi.hoisted(() => ({
  createSupabaseRouteHandlerClientMock: vi.fn(),
  createSupabaseAdminClientMock: vi.fn(),
  uploadAvatarWithUserMock: vi.fn(),
  uploadAvatarAdminMock: vi.fn(),
}))

vi.mock("@/lib/supabase/route", () => ({
  createSupabaseRouteHandlerClient: createSupabaseRouteHandlerClientMock,
}))

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}))

vi.mock("@/lib/storage/avatars", async () => {
  const actual = await vi.importActual<typeof import("@/lib/storage/avatars")>("@/lib/storage/avatars")
  return {
    ...actual,
    uploadAvatarWithUser: uploadAvatarWithUserMock,
    uploadAvatarAdmin: uploadAvatarAdminMock,
  }
})

type SupabaseRouteStubOptions = {
  userId?: string | null
  previousAvatarUrl?: string | null
  profileUpsertError?: { message: string } | null
}

function buildRouteSupabaseStub({
  userId = "user-1",
  previousAvatarUrl = null,
  profileUpsertError = null,
}: SupabaseRouteStubOptions = {}) {
  const profilesMaybeSingle = vi.fn().mockResolvedValue({
    data: { avatar_url: previousAvatarUrl },
    error: null,
  })
  const profilesSelectEq = vi.fn().mockReturnValue({
    maybeSingle: profilesMaybeSingle,
  })
  const profilesSelect = vi.fn().mockReturnValue({
    eq: profilesSelectEq,
  })
  const profilesUpsert = vi.fn().mockResolvedValue({ error: profileUpsertError })
  const remove = vi.fn().mockResolvedValue({ data: [], error: null })
  const storageFrom = vi.fn().mockReturnValue({ remove })

  const from = vi.fn((table: string) => {
    if (table !== "profiles") throw new Error(`Unexpected table: ${table}`)
    return {
      select: profilesSelect,
      upsert: profilesUpsert,
    }
  })

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
    from,
    storage: {
      from: storageFrom,
    },
  }

  return {
    supabase,
    calls: {
      profilesUpsert,
      remove,
      storageFrom,
      profilesSelect,
      profilesSelectEq,
      profilesMaybeSingle,
    },
  }
}

function buildAdminSupabaseStub() {
  const profilesUpsert = vi.fn().mockResolvedValue({ error: null })
  const from = vi.fn((table: string) => {
    if (table !== "profiles") throw new Error(`Unexpected admin table: ${table}`)
    return { upsert: profilesUpsert }
  })
  return {
    admin: { from },
    calls: { profilesUpsert },
  }
}

function buildRequest(file?: File) {
  const formData = new FormData()
  if (file) {
    formData.append("file", file)
  }
  return new NextRequest("http://localhost/api/account/avatar", {
    method: "POST",
    body: formData,
  })
}

describe("account avatar route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when request is unauthenticated", async () => {
    const { supabase } = buildRouteSupabaseStub({ userId: null })
    createSupabaseRouteHandlerClientMock.mockReturnValue(supabase)

    const { POST } = await import("@/app/api/account/avatar/route")
    const response = await POST(buildRequest(new File(["png"], "avatar.png", { type: "image/png" })))

    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ error: "Unauthorized" })
  })

  it("returns 400 when image type is unsupported", async () => {
    const { supabase } = buildRouteSupabaseStub()
    createSupabaseRouteHandlerClientMock.mockReturnValue(supabase)

    const { POST } = await import("@/app/api/account/avatar/route")
    const response = await POST(buildRequest(new File(["gif"], "avatar.gif", { type: "image/gif" })))

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      error: "Unsupported image type. Use PNG, JPEG, or WebP.",
    })
  })

  it("uploads via user client and persists avatar url", async () => {
    const { supabase, calls } = buildRouteSupabaseStub({
      previousAvatarUrl:
        "https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/avatars/user-1/old.png",
    })
    createSupabaseRouteHandlerClientMock.mockReturnValue(supabase)
    uploadAvatarWithUserMock.mockResolvedValue(
      "https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/avatars/user-1/new.png",
    )

    const { POST } = await import("@/app/api/account/avatar/route")
    const response = await POST(buildRequest(new File(["png"], "avatar.png", { type: "image/png" })))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      avatarUrl:
        "https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/avatars/user-1/new.png",
    })
    expect(uploadAvatarWithUserMock).toHaveBeenCalledTimes(1)
    expect(uploadAvatarAdminMock).not.toHaveBeenCalled()
    expect(calls.profilesUpsert).toHaveBeenCalledWith(
      {
        id: "user-1",
        avatar_url:
          "https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/avatars/user-1/new.png",
      },
      { onConflict: "id" },
    )
    expect(calls.storageFrom).toHaveBeenCalledWith("avatars")
    expect(calls.remove).toHaveBeenCalledWith(["user-1/old.png"])
  })

  it("falls back to admin upload when user upload fails", async () => {
    const { supabase, calls } = buildRouteSupabaseStub()
    createSupabaseRouteHandlerClientMock.mockReturnValue(supabase)
    uploadAvatarWithUserMock.mockRejectedValue(new Error("user upload denied"))
    uploadAvatarAdminMock.mockResolvedValue("https://example.com/avatars/user-1/fallback.png")

    const { POST } = await import("@/app/api/account/avatar/route")
    const response = await POST(buildRequest(new File(["png"], "avatar.png", { type: "image/png" })))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      avatarUrl: "https://example.com/avatars/user-1/fallback.png",
    })
    expect(uploadAvatarWithUserMock).toHaveBeenCalledTimes(1)
    expect(uploadAvatarAdminMock).toHaveBeenCalledTimes(1)
    expect(calls.profilesUpsert).toHaveBeenCalledWith(
      {
        id: "user-1",
        avatar_url: "https://example.com/avatars/user-1/fallback.png",
      },
      { onConflict: "id" },
    )
  })

  it("falls back to admin profile persist when user policy blocks profile upsert", async () => {
    const { supabase } = buildRouteSupabaseStub({
      profileUpsertError: { message: "policy denied" },
    })
    const { admin, calls } = buildAdminSupabaseStub()
    createSupabaseRouteHandlerClientMock.mockReturnValue(supabase)
    createSupabaseAdminClientMock.mockReturnValue(admin)
    uploadAvatarWithUserMock.mockResolvedValue("https://example.com/avatars/user-1/new.png")

    const { POST } = await import("@/app/api/account/avatar/route")
    const response = await POST(buildRequest(new File(["png"], "avatar.png", { type: "image/png" })))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      avatarUrl: "https://example.com/avatars/user-1/new.png",
    })
    expect(createSupabaseAdminClientMock).toHaveBeenCalledTimes(1)
    expect(calls.profilesUpsert).toHaveBeenCalledWith(
      {
        id: "user-1",
        avatar_url: "https://example.com/avatars/user-1/new.png",
      },
      { onConflict: "id" },
    )
  })

  it("returns 500 when both upload paths fail", async () => {
    const { supabase } = buildRouteSupabaseStub()
    createSupabaseRouteHandlerClientMock.mockReturnValue(supabase)
    uploadAvatarWithUserMock.mockRejectedValue(new Error("user upload denied"))
    uploadAvatarAdminMock.mockRejectedValue(new Error("admin upload failed"))

    const { POST } = await import("@/app/api/account/avatar/route")
    const response = await POST(buildRequest(new File(["png"], "avatar.png", { type: "image/png" })))
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload).toMatchObject({
      error: "admin upload failed",
      debugToken: expect.any(String),
    })
  })
})
