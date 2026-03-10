import type {
  BrandTypographyConfig,
  OrgProfile,
} from "@/lib/organization/org-profile-brand-types"

import {
  resolveBrandAccentPreset,
  resolveBrandThemePreset,
  resolveBrandTypographyConfig,
  resolveBrandTypographyPreset,
  type BrandTypographyPreset,
} from "./brand-kit-presets"

export const BRAND_KIT_ADDITIONAL_COLOR_LIMIT = 4

export type ExportedBrandKitManifest = {
  name: string
  tagline: string | null
  boilerplate: string | null
  primaryColor: string | null
  palette: string[]
  brandThemePresetId: string | null
  brandAccentPresetId: string | null
  typographyPresetId: string | null
  typographyPresetLabel: string | null
  headingFontLabel: string | null
  bodyFontLabel: string | null
  codeFontLabel: string | null
  brandTypography: BrandTypographyConfig | null
  logoPrimaryFile: string | null
  logoMarkFile: string | null
  bannerFile: string | null
  generatedAt: string
}

function normalizeText(value: string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : ""
  return trimmed.length > 0 ? trimmed : null
}

function normalizeHex(value: string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : ""
  if (!trimmed) return null
  return trimmed.startsWith("#") ? trimmed.toUpperCase() : `#${trimmed.toUpperCase()}`
}

export function resolveBrandPalette(profile: OrgProfile) {
  const palette = new Set<string>()
  const primary = normalizeHex(profile.brandPrimary)
  if (primary) palette.add(primary)
  for (const color of Array.isArray(profile.brandColors) ? profile.brandColors : []) {
    const normalized = normalizeHex(color)
    if (!normalized || normalized === primary) continue
    palette.add(normalized)
    if (palette.size >= BRAND_KIT_ADDITIONAL_COLOR_LIMIT + (primary ? 1 : 0)) {
      break
    }
  }
  return Array.from(palette)
}

export function resolveBrandManifest(profile: OrgProfile, now = new Date()) {
  const theme = resolveBrandThemePreset(profile.brandThemePresetId)
  const accent = resolveBrandAccentPreset(profile.brandAccentPresetId)
  const preset = resolveBrandTypographyPreset(profile.brandTypographyPresetId)
  const typography = resolveBrandTypographyConfig(profile)
  const palette = resolveBrandPalette(profile)
  const manifest: ExportedBrandKitManifest = {
    name: normalizeText(profile.name) ?? "Organization",
    tagline: normalizeText(profile.tagline),
    boilerplate: normalizeText(profile.boilerplate),
    primaryColor: normalizeHex(profile.brandPrimary),
    palette,
    brandThemePresetId: normalizeText(theme?.id ?? profile.brandThemePresetId),
    brandAccentPresetId: normalizeText(accent?.id ?? profile.brandAccentPresetId),
    typographyPresetId: normalizeText(profile.brandTypographyPresetId),
    typographyPresetLabel: preset?.label ?? null,
    headingFontLabel: typography.headings.family,
    bodyFontLabel: typography.body.family,
    codeFontLabel: typography.code.family,
    brandTypography: typography,
    logoPrimaryFile: null,
    logoMarkFile: null,
    bannerFile: null,
    generatedAt: now.toISOString(),
  }

  return {
    manifest,
    preset,
    theme,
    accent,
    typography,
  }
}

export function buildBrandKitReadme({
  manifest,
  preset,
}: {
  manifest: ExportedBrandKitManifest
  preset: BrandTypographyPreset | null
}) {
  const lines = [
    `${manifest.name} Brand Kit`,
    "",
    manifest.tagline ? `Tagline: ${manifest.tagline}` : null,
    manifest.boilerplate ? `Boilerplate: ${manifest.boilerplate}` : null,
    manifest.primaryColor ? `Primary color: ${manifest.primaryColor}` : null,
    manifest.palette.length > 0 ? `Palette: ${manifest.palette.join(", ")}` : null,
    manifest.brandThemePresetId ? `Theme preset: ${manifest.brandThemePresetId}` : null,
    manifest.brandAccentPresetId ? `Accent preset: ${manifest.brandAccentPresetId}` : null,
    preset ? `Typography preset: ${preset.label}` : null,
    manifest.brandTypography
      ? `Typography slots: headings ${manifest.brandTypography.headings.family} ${manifest.brandTypography.headings.weight}, body ${manifest.brandTypography.body.family} ${manifest.brandTypography.body.weight}, code ${manifest.brandTypography.code.family}`
      : null,
    "",
    "Included files:",
    manifest.logoPrimaryFile ? `- logos/${manifest.logoPrimaryFile}` : null,
    manifest.logoMarkFile ? `- logos/${manifest.logoMarkFile}` : null,
    manifest.bannerFile ? `- banners/${manifest.bannerFile}` : null,
    "- brand/brand.json",
    "- brand/brand.txt",
  ].filter((line): line is string => Boolean(line))

  return lines.join("\n")
}
