import { beforeEach, describe, expect, it, vi } from "vitest"

import { refreshPersonLinkedInImageAction } from "@/actions/people"

import { resetTestMocks } from "./test-utils"

const mocks = vi.hoisted(() => ({
  canEditOrganization: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
  fetchLinkedInProfileImage: vi.fn(),
  mutateOrganizationPeopleProfile: vi.fn(),
  requireServerSession: vi.fn(),
  resolveActiveOrganization: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  requireServerSession: mocks.requireServerSession,
}))

vi.mock("@/lib/organization/active-org", () => ({
  canEditOrganization: mocks.canEditOrganization,
  resolveActiveOrganization: mocks.resolveActiveOrganization,
}))

vi.mock("@/lib/people/linkedin-image-refresh", () => ({
  fetchLinkedInProfileImage: mocks.fetchLinkedInProfileImage,
}))

vi.mock("@/lib/people/profile-write", () => ({
  mutateOrganizationPeopleProfile: mocks.mutateOrganizationPeopleProfile,
}))

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createSupabaseAdminClient,
}))

const ORIGINAL_IMAGE = "users/org-1/person-1.jpg"
const ORIGINAL_LINKEDIN = "https://linkedin.com/in/original"

function prepareRefresh({
  currentLinkedin = ORIGINAL_LINKEDIN,
  uploadError = null,
}: {
  currentLinkedin?: string
  uploadError?: { message: string } | null
} = {}) {
  const upload = vi.fn().mockResolvedValue({ error: uploadError })
  const remove = vi.fn().mockResolvedValue({ error: null })
  const storageFrom = vi.fn(() => ({ upload, remove }))
  const admin = {
    storage: {
      createBucket: vi.fn(),
      from: storageFrom,
      getBucket: vi.fn().mockResolvedValue({ data: { id: "avatars" } }),
    },
  }
  const organizationQuery = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: {
        profile: {
          org_people: [
            {
              id: "person-1",
              name: "Original Person",
              category: "member",
              image: ORIGINAL_IMAGE,
              linkedin: ORIGINAL_LINKEDIN,
            },
          ],
        },
      },
      error: null,
    }),
    select: vi.fn().mockReturnThis(),
  }
  const supabase = {
    from: vi.fn(() => organizationQuery),
  }

  mocks.requireServerSession.mockResolvedValue({
    session: { user: { id: "user-1" } },
    supabase,
  })
  mocks.resolveActiveOrganization.mockResolvedValue({
    orgId: "org-1",
    role: "owner",
  })
  mocks.canEditOrganization.mockReturnValue(true)
  mocks.createSupabaseAdminClient.mockReturnValue(admin)
  mocks.fetchLinkedInProfileImage.mockResolvedValue({
    bytes: new Uint8Array([1, 2, 3]),
    contentType: "image/png",
  })
  mocks.mutateOrganizationPeopleProfile.mockImplementation(
    async ({ mutate }: { mutate: (people: unknown[]) => unknown }) => {
      const result = mutate([
        {
          id: "person-1",
          name: "Original Person",
          category: "member",
          image: ORIGINAL_IMAGE,
          linkedin: currentLinkedin,
        },
      ]) as
        | { error: string }
        | {
            ok: true
            value: { previousImage: string | null }
          }
      if ("error" in result) return result
      return { ok: true, value: result.value }
    }
  )

  return { remove, storageFrom, upload }
}

describe("People LinkedIn image refresh", () => {
  beforeEach(() => {
    resetTestMocks()
    for (const mock of Object.values(mocks)) mock.mockReset()
  })

  it("removes only the staged object when LinkedIn changes during refresh", async () => {
    const { remove, upload } = prepareRefresh({
      currentLinkedin: "https://linkedin.com/in/changed",
    })

    await expect(refreshPersonLinkedInImageAction("person-1")).resolves.toEqual(
      { error: "LinkedIn changed. Reload before refreshing." }
    )

    const stagedPath = upload.mock.calls[0]?.[0] as string
    expect(stagedPath).toMatch(/^users\/org-1\/person-1-[0-9a-f-]+\.png$/)
    expect(stagedPath).not.toBe(ORIGINAL_IMAGE)
    expect(remove).toHaveBeenCalledOnce()
    expect(remove).toHaveBeenCalledWith([stagedPath])
    expect(remove).not.toHaveBeenCalledWith([ORIGINAL_IMAGE])
  })

  it("saves a unique object and removes the prior owned image after success", async () => {
    const { remove, upload } = prepareRefresh()

    await expect(refreshPersonLinkedInImageAction("person-1")).resolves.toEqual(
      { ok: true }
    )

    const stagedPath = upload.mock.calls[0]?.[0] as string
    expect(upload).toHaveBeenCalledWith(stagedPath, new Uint8Array([1, 2, 3]), {
      contentType: "image/png",
      upsert: false,
    })
    expect(remove).toHaveBeenCalledOnce()
    expect(remove).toHaveBeenCalledWith([ORIGINAL_IMAGE])
  })

  it("stops before the profile write when the upload fails", async () => {
    const { remove } = prepareRefresh({
      uploadError: { message: "storage unavailable" },
    })

    await expect(refreshPersonLinkedInImageAction("person-1")).resolves.toEqual(
      { error: "Upload failed" }
    )

    expect(mocks.mutateOrganizationPeopleProfile).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })
})
