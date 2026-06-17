import type { OrgProfile } from "@/lib/organization/org-profile-brand-types"

export type BrandKitReadinessStatus = "needs-setup" | "in-progress" | "ready"

export type BrandKitReadiness = {
  status: BrandKitReadinessStatus
  completedCount: number
  totalCount: number
  hasPrimaryLogo: boolean
  hasLogoMark: boolean
  hasBoilerplate: boolean
  hasPrimaryColor: boolean
  hasTypography: boolean
  hasTypographyPreset: boolean
}

export function resolveBrandKitReadiness(profile: OrgProfile): BrandKitReadiness {
  const hasPrimaryLogo = Boolean(profile.logoUrl?.trim())
  const hasLogoMark = Boolean(profile.brandMarkUrl?.trim())
  const hasBoilerplate = Boolean(profile.boilerplate?.trim())
  const hasPrimaryColor = Boolean(profile.brandPrimary?.trim())
  const hasTypography = Boolean(
    profile.brandTypographyPresetId?.trim() ||
      profile.brandTypography?.headings?.family?.trim(),
  )

  const completedCount = [
    hasPrimaryLogo,
    hasLogoMark,
    hasBoilerplate,
    hasPrimaryColor,
    hasTypography,
  ].filter(Boolean).length

  const status: BrandKitReadinessStatus =
    completedCount === 0
      ? "needs-setup"
      : hasPrimaryLogo && hasBoilerplate && hasPrimaryColor && hasTypography
        ? "ready"
        : "in-progress"

  return {
    status,
    completedCount,
    totalCount: 5,
    hasPrimaryLogo,
    hasLogoMark,
    hasBoilerplate,
    hasPrimaryColor,
    hasTypography,
    hasTypographyPreset: hasTypography,
  }
}
