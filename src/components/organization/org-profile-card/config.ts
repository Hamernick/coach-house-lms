import BuildingIcon from "lucide-react/dist/esm/icons/building-2"
import ClipboardListIcon from "lucide-react/dist/esm/icons/clipboard-list"
import UsersIcon from "lucide-react/dist/esm/icons/users"

import type {
  BrandTypographyConfig,
  BrandTypographyTracking,
  OrgProfile,
  ProfileTab,
} from "./types"

export const ORG_PROFILE_TABS: Array<{ value: ProfileTab; label: string; icon: typeof BuildingIcon }> = [
  { value: "company", label: "About", icon: BuildingIcon },
  { value: "programs", label: "Programs", icon: ClipboardListIcon },
  { value: "people", label: "People", icon: UsersIcon },
]

function isTrackingValue(value: unknown): value is BrandTypographyTracking {
  return (
    value === "tighter" ||
    value === "tight" ||
    value === "normal" ||
    value === "wide" ||
    value === "wider"
  )
}

function normalizeTypography(source: OrgProfile): BrandTypographyConfig | null {
  const candidate = source.brandTypography
  if (!candidate || typeof candidate !== "object") return null

  const headings = candidate.headings
  const body = candidate.body
  const code = candidate.code

  if (
    !headings ||
    typeof headings !== "object" ||
    !body ||
    typeof body !== "object" ||
    !code ||
    typeof code !== "object"
  ) {
    return null
  }

  const headingsFamily = typeof headings.family === "string" ? headings.family : ""
  const headingsWeight = typeof headings.weight === "string" ? headings.weight : ""
  const headingsTracking = isTrackingValue(headings.tracking) ? headings.tracking : "normal"
  const bodyFamily = typeof body.family === "string" ? body.family : ""
  const bodyWeight = typeof body.weight === "string" ? body.weight : ""
  const bodyTracking = isTrackingValue(body.tracking) ? body.tracking : "normal"
  const codeFamily = typeof code.family === "string" ? code.family : ""

  if (!headingsFamily || !headingsWeight || !bodyFamily || !bodyWeight || !codeFamily) {
    return null
  }

  return {
    headings: {
      family: headingsFamily,
      weight: headingsWeight,
      tracking: headingsTracking,
    },
    body: {
      family: bodyFamily,
      weight: bodyWeight,
      tracking: bodyTracking,
    },
    code: {
      family: codeFamily,
    },
  }
}

export function normalizeCompanyProfile(source: OrgProfile): OrgProfile {
  return {
    name: source.name ?? "",
    description: source.description ?? "",
    tagline: source.tagline ?? "",
    ein: source.ein ?? "",
    formationStatus:
      source.formationStatus === "pre_501c3" ||
      source.formationStatus === "in_progress" ||
      source.formationStatus === "approved"
        ? source.formationStatus
        : "in_progress",
    rep: source.rep ?? "",
    email: source.email ?? "",
    phone: source.phone ?? "",
    address: source.address ?? "",
    addressStreet: source.addressStreet ?? "",
    addressCity: source.addressCity ?? "",
    addressState: source.addressState ?? "",
    addressPostal: source.addressPostal ?? "",
    addressCountry: source.addressCountry ?? "",
    locationType: source.locationType === "online" ? "online" : "in_person",
    locationUrl: source.locationUrl ?? "",
    logoUrl: source.logoUrl ?? "",
    brandMarkUrl: source.brandMarkUrl ?? "",
    headerUrl: source.headerUrl ?? "",
    publicUrl: source.publicUrl ?? "",
    twitter: source.twitter ?? "",
    facebook: source.facebook ?? "",
    linkedin: source.linkedin ?? "",
    instagram: source.instagram ?? "",
    youtube: source.youtube ?? "",
    tiktok: source.tiktok ?? "",
    newsletter: source.newsletter ?? "",
    github: source.github ?? "",
    vision: source.vision ?? "",
    mission: source.mission ?? "",
    need: source.need ?? "",
    values: source.values ?? "",
    programs: source.programs ?? "",
    reports: source.reports ?? "",
    boilerplate: source.boilerplate ?? "",
    brandPrimary: source.brandPrimary ?? "",
    brandColors: Array.isArray(source.brandColors) ? source.brandColors : [],
    brandThemePresetId: source.brandThemePresetId ?? "",
    brandAccentPresetId: source.brandAccentPresetId ?? "",
    brandTypographyPresetId: source.brandTypographyPresetId ?? "",
    brandTypography: normalizeTypography(source),
    publicSlug: source.publicSlug ?? "",
    isPublic: Boolean(source.isPublic ?? false),
  }
}
