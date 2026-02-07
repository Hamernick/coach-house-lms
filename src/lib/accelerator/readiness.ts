import type { ModuleCardStatus } from "@/lib/accelerator/progress"
import type { RoadmapSection } from "@/lib/roadmap"

const FUNDABLE_THRESHOLD = 70
const VERIFIED_THRESHOLD = 90

const CORE_FORMATION_MODULE_SLUGS = new Set(["naming-your-nfp", "nfp-registration", "filing-1023"])
const CORE_ROADMAP_SECTION_IDS = new Set([
  "origin_story",
  "need",
  "mission_vision_values",
  "theory_of_change",
  "program",
])
const PROFILE_COMPLETENESS_KEYS = [
  "name",
  "tagline",
  "mission",
  "need",
  "values",
  "address_city",
  "address_state",
] as const
const VERIFIED_DOC_KEYS = ["verificationLetter", "bylaws", "stateRegistration", "goodStandingCertificate", "w9"] as const

type ReadinessModule = {
  slug: string
  status: ModuleCardStatus
}

type ReadinessProgram = {
  goal_cents: number | null
}

type ReadinessInput = {
  profile: Record<string, unknown>
  modules: ReadinessModule[]
  roadmapSections: RoadmapSection[]
  programs: ReadinessProgram[]
  peopleCount: number
}

export type AcceleratorReadinessSummary = {
  score: number
  progressPercent: number
  fundableCheckpoint: number
  verifiedCheckpoint: number
  fundable: boolean
  verified: boolean
  fundableMissing: string[]
  verifiedMissing: string[]
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
}

function hasUploadedDocument(documents: Record<string, unknown>, key: string) {
  const raw = documents[key]
  if (!isRecord(raw)) return false
  return hasText(raw.path)
}

function isSectionComplete(section: RoadmapSection) {
  if (section.status === "complete") return true
  if (section.content.trim().length > 0) return true
  return false
}

export function resolveAcceleratorReadiness({
  profile,
  modules,
  roadmapSections,
  programs,
  peopleCount,
}: ReadinessInput): AcceleratorReadinessSummary {
  const moduleStatusBySlug = new Map(modules.map((module) => [module.slug.trim().toLowerCase(), module.status]))
  const coreLessonsCompleted = Array.from(CORE_FORMATION_MODULE_SLUGS).filter(
    (slug) => moduleStatusBySlug.get(slug) === "completed",
  ).length
  const coreLessonsComplete = coreLessonsCompleted === CORE_FORMATION_MODULE_SLUGS.size

  const documents = isRecord(profile.documents) ? profile.documents : {}
  const hasVerificationLetter = hasUploadedDocument(documents, "verificationLetter")
  const hasArticles = hasUploadedDocument(documents, "articlesOfIncorporation")

  const hasProgram = programs.length > 0
  const hasFundingGoal = programs.some((program) => Number(program.goal_cents ?? 0) > 0)

  const profileFieldsCompleted = PROFILE_COMPLETENESS_KEYS.filter((key) => hasText(profile[key])).length
  const profileScore = Math.round((profileFieldsCompleted / PROFILE_COMPLETENESS_KEYS.length) * 20)

  const roadmapCoreCompleted = roadmapSections.filter(
    (section) => CORE_ROADMAP_SECTION_IDS.has(section.id) && isSectionComplete(section),
  ).length
  const roadmapScore = Math.round((roadmapCoreCompleted / CORE_ROADMAP_SECTION_IDS.size) * 30)

  const formationScore = Math.round((coreLessonsCompleted / CORE_FORMATION_MODULE_SLUGS.size) * 25)
  const programScore = hasFundingGoal ? 15 : hasProgram ? 8 : 0
  const teamScore = peopleCount >= 1 ? 10 : 0

  const fundableScore = clamp(profileScore + roadmapScore + formationScore + programScore + teamScore, 0, 100)
  const fundableHardRequirements = coreLessonsComplete && hasFundingGoal && (hasVerificationLetter || hasArticles)
  const fundable = fundableHardRequirements && fundableScore >= FUNDABLE_THRESHOLD

  const docDepthCount = VERIFIED_DOC_KEYS.filter((key) => hasUploadedDocument(documents, key)).length
  const docDepthScore = Math.round((docDepthCount / VERIFIED_DOC_KEYS.length) * 20)
  const hasAdvancedModuleSignal = modules.some((module) => {
    const slug = module.slug.trim().toLowerCase()
    if (CORE_FORMATION_MODULE_SLUGS.has(slug)) return false
    return module.status === "in_progress" || module.status === "completed"
  })
  const verifiedScore = clamp((fundable ? 70 : 0) + docDepthScore + (hasAdvancedModuleSignal ? 10 : 0), 0, 100)

  const formationStatus = String(profile.formationStatus ?? "").trim().toLowerCase()
  const verifiedMandatory =
    hasVerificationLetter &&
    formationStatus === "approved" &&
    coreLessonsComplete &&
    roadmapCoreCompleted === CORE_ROADMAP_SECTION_IDS.size &&
    hasFundingGoal
  const verified = verifiedMandatory && verifiedScore >= VERIFIED_THRESHOLD

  const score = verified ? 100 : fundable ? Math.max(fundableScore, FUNDABLE_THRESHOLD) : fundableScore
  const progressPercent = verified
    ? 100
    : fundable
      ? clamp(score, FUNDABLE_THRESHOLD, VERIFIED_THRESHOLD - 1)
      : clamp(score, 0, FUNDABLE_THRESHOLD - 1)

  const fundableMissing: string[] = []
  if (!coreLessonsComplete) fundableMissing.push("Complete formation lessons")
  if (!hasFundingGoal) fundableMissing.push("Set a program funding goal")
  if (!(hasVerificationLetter || hasArticles)) fundableMissing.push("Upload legal formation document")

  const verifiedMissing: string[] = []
  if (!hasVerificationLetter) verifiedMissing.push("Upload verification letter")
  if (formationStatus !== "approved") verifiedMissing.push("Formation status must be approved")
  if (!coreLessonsComplete) verifiedMissing.push("Complete formation lessons")
  if (roadmapCoreCompleted !== CORE_ROADMAP_SECTION_IDS.size) verifiedMissing.push("Complete core roadmap sections")
  if (!hasFundingGoal) verifiedMissing.push("Set a program funding goal")

  return {
    score,
    progressPercent,
    fundableCheckpoint: FUNDABLE_THRESHOLD,
    verifiedCheckpoint: VERIFIED_THRESHOLD,
    fundable,
    verified,
    fundableMissing,
    verifiedMissing,
  }
}
