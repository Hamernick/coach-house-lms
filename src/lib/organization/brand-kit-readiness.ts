import type { OrgProfile } from "@/lib/organization/org-profile-brand-types"

export type BrandKitReadinessStatus = "needs-setup" | "in-progress" | "ready"

export type BrandKitReadiness = {
  status: BrandKitReadinessStatus
  completedCount: number
  totalCount: number
  hasPrimaryLogo: boolean
  hasLogoMark: boolean
  hasBrandVoice: boolean
  hasPrimaryColor: boolean
  hasTypography: boolean
  hasTypographyPreset: boolean
}

export function resolveBrandKitReadiness(
  profile: OrgProfile
): BrandKitReadiness {
  const hasPrimaryLogo = Boolean(profile.logoUrl?.trim())
  const hasLogoMark = Boolean(profile.brandMarkUrl?.trim())
  const hasBrandVoice = Boolean(
    profile.brandVoiceGuidelines?.trim() ||
    profile.brandVoiceTone?.trim() ||
    profile.brandVoiceAudience?.trim() ||
    profile.boilerplate?.trim()
  )
  const hasPrimaryColor = Boolean(profile.brandPrimary?.trim())
  const hasTypography = Boolean(
    profile.brandTypographyPresetId?.trim() ||
    profile.brandTypography?.headings?.family?.trim()
  )

  const completedCount = [
    hasPrimaryLogo,
    hasLogoMark,
    hasBrandVoice,
    hasPrimaryColor,
    hasTypography,
  ].filter(Boolean).length

  const status: BrandKitReadinessStatus =
    completedCount === 0
      ? "needs-setup"
      : hasPrimaryLogo && hasBrandVoice && hasPrimaryColor && hasTypography
        ? "ready"
        : "in-progress"

  return {
    status,
    completedCount,
    totalCount: 5,
    hasPrimaryLogo,
    hasLogoMark,
    hasBrandVoice,
    hasPrimaryColor,
    hasTypography,
    hasTypographyPreset: hasTypography,
  }
}
