import {
  PROFILE_COMPLETENESS_KEYS,
  VERIFIED_DOC_KEYS,
} from "@/lib/accelerator/readiness"
import { resolveRoadmapSections } from "@/lib/roadmap"
import type { Json } from "@/lib/supabase"
import type { MemberWorkspaceAdminOrganizationSetupItem } from "@/features/member-workspace/types"

export type AdminOrganizationSetupProgram = {
  goal_cents: number | null
}

function toRecord(value: Json | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function toUnknownRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function hasText(value: unknown) {
  return toTrimmedString(value).length > 0
}

function hasUploadedDocument(documents: Record<string, unknown>, key: string) {
  const raw = toUnknownRecord(documents[key])
  return hasText(raw.path) || hasText(raw.url)
}

function isProfileSetupFieldComplete(
  key: (typeof PROFILE_COMPLETENESS_KEYS)[number],
  profile: Record<string, unknown>,
) {
  if (key === "address_city") {
    return hasText(profile.address_city) || hasText(profile.addressCity)
  }
  if (key === "address_state") {
    return hasText(profile.address_state) || hasText(profile.addressState)
  }
  return hasText(profile[key])
}

function isRoadmapSectionComplete(
  sectionId: string,
  roadmapSections: ReturnType<typeof resolveRoadmapSections>,
) {
  const section = roadmapSections.find((entry) => entry.id === sectionId)
  if (!section) return false
  if (section.status === "complete") return true
  return section.content.trim().length > 0
}

function buildSetupChecklist({
  profileValue,
  publicSlug,
  memberCount,
  programs,
}: {
  profileValue: Json | null
  publicSlug: string | null
  memberCount: number
  programs: AdminOrganizationSetupProgram[]
}) {
  const profile = toRecord(profileValue)
  const documents = toUnknownRecord(profile.documents)
  const roadmapSections = resolveRoadmapSections(profile)
  const hasProgram = programs.length > 0
  const hasFundingGoal = programs.some((program) => Number(program.goal_cents ?? 0) > 0)
  const hasLegalFormationDocument =
    hasUploadedDocument(documents, "verificationLetter") || hasUploadedDocument(documents, "articlesOfIncorporation")
  const profileFieldLabels: Record<(typeof PROFILE_COMPLETENESS_KEYS)[number], string> = {
    name: "Add organization name",
    tagline: "Add tagline",
    mission: "Add mission statement",
    need: "Describe the community need",
    values: "Add organizational values",
    address_city: "Add city",
    address_state: "Add state",
  }
  const verifiedDocumentLabels: Record<(typeof VERIFIED_DOC_KEYS)[number], string> = {
    verificationLetter: "Upload verification letter",
    bylaws: "Upload bylaws",
    stateRegistration: "Upload state registration",
    goodStandingCertificate: "Upload good standing certificate",
    w9: "Upload W-9",
  }
  const profileItems = PROFILE_COMPLETENESS_KEYS.map((key) => ({
    id: `profile-${key}`,
    label: profileFieldLabels[key],
    complete: isProfileSetupFieldComplete(key, profile),
  }))
  const verifiedDocumentItems = VERIFIED_DOC_KEYS.map((key) => ({
    id: `document-${key}`,
    label: verifiedDocumentLabels[key],
    complete: hasUploadedDocument(documents, key),
  }))

  return [
    ...profileItems,
    {
      id: "logo",
      label: "Upload organization logo",
      complete: hasText(profile.logoUrl),
    },
    {
      id: "public-slug",
      label: "Claim public slug",
      complete: hasText(publicSlug),
    },
    {
      id: "website",
      label: "Add website",
      complete: hasText(profile.website),
    },
    {
      id: "formation-status",
      label: "Set formation status",
      complete: hasText(profile.formationStatus),
    },
    {
      id: "roadmap-origin-story",
      label: "Complete roadmap: Origin story",
      complete: isRoadmapSectionComplete("origin_story", roadmapSections),
    },
    {
      id: "roadmap-need",
      label: "Complete roadmap: Need",
      complete: isRoadmapSectionComplete("need", roadmapSections),
    },
    {
      id: "roadmap-mission-vision-values",
      label: "Complete roadmap: Mission, vision, and values",
      complete: isRoadmapSectionComplete("mission_vision_values", roadmapSections),
    },
    {
      id: "roadmap-theory-of-change",
      label: "Complete roadmap: Theory of change",
      complete: isRoadmapSectionComplete("theory_of_change", roadmapSections),
    },
    {
      id: "roadmap-program",
      label: "Complete roadmap: Program",
      complete: isRoadmapSectionComplete("program", roadmapSections),
    },
    {
      id: "program",
      label: "Add a program",
      complete: hasProgram,
    },
    {
      id: "funding-goal",
      label: "Set a program funding goal",
      complete: hasFundingGoal,
    },
    {
      id: "team",
      label: "Add at least one team member",
      complete: memberCount > 0,
    },
    {
      id: "formation-document",
      label: "Upload legal formation document",
      complete: hasLegalFormationDocument,
    },
    ...verifiedDocumentItems,
  ] satisfies MemberWorkspaceAdminOrganizationSetupItem[]
}

export function computeAdminOrganizationSetupSummary({
  profile,
  publicSlug,
  memberCount,
  programs,
}: {
  profile: Json | null
  publicSlug: string | null
  memberCount: number
  programs: AdminOrganizationSetupProgram[]
}) {
  const setupItems = buildSetupChecklist({
    profileValue: profile,
    publicSlug,
    memberCount,
    programs,
  })
  const setupCompletedCount = setupItems.filter((item) => item.complete).length
  const setupTotalCount = setupItems.length

  return {
    setupProgress: Math.round((setupCompletedCount / setupTotalCount) * 100),
    setupCompletedCount,
    setupTotalCount,
    missingSetupCount: setupTotalCount - setupCompletedCount,
    setupItems,
  }
}
