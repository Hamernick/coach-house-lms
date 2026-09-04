import { beforeEach, describe, expect, it, vi } from "vitest"

import { updateOrganizationProfileAction } from "@/actions/organization"
import {
  ORG_PROFILE_BRAND_COLOR_LIMIT,
  ORG_PROFILE_BRAND_VOICE_ATTRIBUTE_MAX_LENGTH,
  ORG_PROFILE_BRAND_VOICE_LONG_FORM_MAX_LENGTH,
  ORG_PROFILE_ROADMAP_TEXT_MAX_LENGTH,
  organizationProfilePersistencePatchSchema,
  validateOrganizationProfilePersistencePatch,
} from "@/lib/organization/profile-persistence-validation"
import { resolveOrganizationNarrativePlainText } from "@/lib/roadmap"

import { resetTestMocks, revalidatePathMock } from "./test-utils"

const authMocks = vi.hoisted(() => ({
  requireServerSession: vi.fn(),
  resolveActiveOrganization: vi.fn(),
  canEditOrganization: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  requireServerSession: authMocks.requireServerSession,
}))

vi.mock("@/lib/organization/active-org", () => ({
  resolveActiveOrganization: authMocks.resolveActiveOrganization,
  canEditOrganization: authMocks.canEditOrganization,
}))

function prepareOrganizationSave(existingProfile: Record<string, unknown>) {
  let updatedRow: Record<string, unknown> | null = null
  const selectQuery = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: {
        ein: null,
        profile: existingProfile,
        location_lat: null,
        location_lng: null,
        public_slug: null,
        is_public: false,
        updated_at: "2026-08-05T18:00:00.000Z",
      },
      error: null,
    }),
  }
  const updateQuery = {
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { user_id: "org-1" },
      error: null,
    }),
  }
  const organizationTable = {
    select: vi.fn(() => selectQuery),
    update: vi.fn((payload: Record<string, unknown>) => {
      updatedRow = payload
      return updateQuery
    }),
  }
  const from = vi.fn((table: string) => {
    if (table !== "organizations") {
      throw new Error(`Unexpected table: ${table}`)
    }
    return organizationTable
  })

  authMocks.requireServerSession.mockResolvedValue({
    supabase: { from },
    session: { user: { id: "user-1" } },
  })
  authMocks.resolveActiveOrganization.mockResolvedValue({
    orgId: "org-1",
    role: "owner",
  })
  authMocks.canEditOrganization.mockReturnValue(true)

  return {
    getUpdatedProfile() {
      return (updatedRow?.profile ?? null) as Record<string, unknown> | null
    },
  }
}

describe("organization profile persistence validation", () => {
  beforeEach(() => {
    resetTestMocks()
    authMocks.requireServerSession.mockReset()
    authMocks.resolveActiveOrganization.mockReset()
    authMocks.canEditOrganization.mockReset()
  })

  it("accepts the complete Brand Kit and MVV persistence contract", () => {
    const result = organizationProfilePersistencePatchSchema.safeParse({
      mission: "Equip community leaders.",
      vision: "Every neighborhood thrives.",
      values: "Care, clarity, rigor.",
      narrativeRevisions: {
        mission: "2026-08-05T18:00:00.000Z",
        vision: null,
        values: "2026-08-05T18:00:00.000Z",
      },
      brandVoiceAudience: "Community leaders",
      brandVoiceTone: "Warm and direct",
      brandVoiceStyle: "Plain language",
      brandVoicePersonality: "A trusted guide",
      brandVoiceGuidelines: "Lead with the clearest next step.",
      brandVoiceAvoid: "Insider jargon",
      brandPrimary: "6c3aed",
      brandColors: ["#111827", "F9FAFB"],
      brandThemePresetId: "skyline",
      brandAccentPresetId: "violet",
      brandTypographyPresetId: "modern-grotesk",
      brandTypography: {
        headings: {
          family: "Inter",
          weight: "600",
          tracking: "normal",
        },
        body: {
          family: "Inter",
          weight: "400",
          tracking: "normal",
        },
        code: { family: "Geist Mono" },
      },
      futureProfileKey: { preserved: true },
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.brandPrimary).toBe("#6c3aed")
      expect(result.data.futureProfileKey).toEqual({ preserved: true })
    }
  })

  it.each([
    {
      payload: {
        brandVoiceTone: "x".repeat(
          ORG_PROFILE_BRAND_VOICE_ATTRIBUTE_MAX_LENGTH + 1
        ),
      },
      field: "brandVoiceTone",
    },
    {
      payload: {
        brandVoiceGuidelines: "x".repeat(
          ORG_PROFILE_BRAND_VOICE_LONG_FORM_MAX_LENGTH + 1
        ),
      },
      field: "brandVoiceGuidelines",
    },
    { payload: { brandPrimary: "#123" }, field: "brandPrimary" },
    {
      payload: {
        brandColors: Array.from(
          { length: ORG_PROFILE_BRAND_COLOR_LIMIT + 1 },
          () => "#123456"
        ),
      },
      field: "brandColors",
    },
    {
      payload: {
        brandTypography: {
          headings: { family: "Inter", weight: "600", tracking: "invalid" },
          body: { family: "Inter", weight: "400", tracking: "normal" },
          code: { family: "Geist Mono" },
        },
      },
      field: "brandTypography",
    },
    {
      payload: {
        mission: "x".repeat(ORG_PROFILE_ROADMAP_TEXT_MAX_LENGTH + 1),
      },
      field: "mission",
    },
    {
      payload: { narrativeRevisions: { mission: 42 } },
      field: "narrativeRevisions",
    },
  ])("rejects invalid persistence input at $field", ({ payload, field }) => {
    expect(validateOrganizationProfilePersistencePatch(payload)).toMatchObject({
      success: false,
      field,
    })
  })

  it("rejects invalid Brand Kit data before reading or writing the organization", async () => {
    const from = vi.fn()
    authMocks.requireServerSession.mockResolvedValue({
      supabase: { from },
      session: { user: { id: "user-1" } },
    })
    authMocks.resolveActiveOrganization.mockResolvedValue({
      orgId: "org-1",
      role: "owner",
    })
    authMocks.canEditOrganization.mockReturnValue(true)

    const result = await updateOrganizationProfileAction({
      brandVoiceTone: "x".repeat(
        ORG_PROFILE_BRAND_VOICE_ATTRIBUTE_MAX_LENGTH + 1
      ),
    })

    expect(result).toEqual({
      error: `Brand voice fields must be ${ORG_PROFILE_BRAND_VOICE_ATTRIBUTE_MAX_LENGTH} characters or less.`,
      field: "brandVoiceTone",
    })
    expect(from).not.toHaveBeenCalled()
  })

  it("preserves MVV and unknown fields during a Brand Kit save", async () => {
    const save = prepareOrganizationSave({
      mission: "Existing mission",
      vision: "Existing vision",
      values: "Existing values",
      brandVoiceTone: "Formal",
      futureProfileKey: { preserved: true },
    })

    expect(
      await updateOrganizationProfileAction({ brandVoiceTone: "Warm" })
    ).toMatchObject({ ok: true })

    expect(save.getUpdatedProfile()).toMatchObject({
      mission: "Existing mission",
      vision: "Existing vision",
      values: "Existing values",
      brandVoiceTone: "Warm",
      futureProfileKey: { preserved: true },
    })
    expect(revalidatePathMock).toHaveBeenCalledWith("/workspace")
    expect(revalidatePathMock).toHaveBeenCalledWith("/my-organization")
    expect(revalidatePathMock).toHaveBeenCalledWith("/organization")
    expect(revalidatePathMock).toHaveBeenCalledWith("/")
  })

  it("preserves Brand Kit and unknown fields during an MVV save", async () => {
    const save = prepareOrganizationSave({
      mission: "Existing mission",
      brandPrimary: "#6C3AED",
      brandVoiceTone: "Warm and direct",
      futureProfileKey: { preserved: true },
    })

    expect(
      await updateOrganizationProfileAction({
        mission: "<p>Updated mission</p>",
        narrativeRevisions: {
          mission: null,
          vision: null,
          values: null,
        },
      })
    ).toMatchObject({ ok: true })

    const updatedProfile = save.getUpdatedProfile()
    expect(updatedProfile).toMatchObject({
      brandPrimary: "#6C3AED",
      brandVoiceTone: "Warm and direct",
      futureProfileKey: { preserved: true },
    })
    expect(
      resolveOrganizationNarrativePlainText(updatedProfile, "mission")
    ).toBe("Updated mission")
  })
})
