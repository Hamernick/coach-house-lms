import { stripHtml } from "@/lib/markdown/convert"

import {
  resolveLegacyOrganizationNarratives,
  resolveOrganizationNarratives,
  updateOrganizationNarratives,
  type OrganizationNarrativeKey,
  type OrganizationNarratives,
} from "./organization-narratives"

type ReviewableNarrativeKey = Exclude<OrganizationNarrativeKey, "mission">

export type MvvReviewExtract = {
  content: string
  heading: string
  sourceStart: number
  sourceEnd: number
}

export type MvvReviewProposal = {
  combinedContent: string
  combinedContentHash: string
  legacy: OrganizationNarratives
  extracts: Record<ReviewableNarrativeKey, MvvReviewExtract | null>
  notes: Record<ReviewableNarrativeKey, string>
}

const HEADING_PATTERN = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi
const HEADING_LABELS: Record<ReviewableNarrativeKey, Set<string>> = {
  vision: new Set(["vision", "our vision", "vision statement"]),
  values: new Set([
    "values",
    "our values",
    "core values",
    "our core values",
    "values statement",
  ]),
}

function hashContent(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}

function normalizeHeading(value: string): string {
  return stripHtml(value)
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function proposeMissionVisionValuesReview(
  profile: Record<string, unknown> | null | undefined
): MvvReviewProposal {
  const combinedContent = resolveOrganizationNarratives(profile, {
    includeLegacyFallback: false,
  }).mission
  const headings = Array.from(combinedContent.matchAll(HEADING_PATTERN)).map(
    (match) => ({
      heading: stripHtml(match[2] ?? ""),
      label: normalizeHeading(match[2] ?? ""),
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    })
  )

  const extracts = { vision: null, values: null } as Record<
    ReviewableNarrativeKey,
    MvvReviewExtract | null
  >
  const notes = { vision: "", values: "" } as Record<
    ReviewableNarrativeKey,
    string
  >

  for (const key of ["vision", "values"] as const) {
    const matches = headings.filter((heading) =>
      HEADING_LABELS[key].has(heading.label)
    )
    if (matches.length === 0) {
      notes[key] = `No explicit ${key} heading found.`
      continue
    }
    if (matches.length > 1) {
      notes[key] = `Multiple ${key} headings found; manual selection required.`
      continue
    }

    const heading = matches[0]
    const nextHeading = headings.find((entry) => entry.start > heading.end)
    const sourceEnd = nextHeading?.start ?? combinedContent.length
    const content = combinedContent.slice(heading.end, sourceEnd).trim()
    if (stripHtml(content).length < 3) {
      notes[key] = `The ${key} heading has no usable content.`
      continue
    }

    extracts[key] = {
      content,
      heading: heading.heading,
      sourceStart: heading.end,
      sourceEnd,
    }
    notes[key] =
      `Reliable extract found under the explicit ${heading.heading} heading.`
  }

  return {
    combinedContent,
    combinedContentHash: hashContent(combinedContent),
    legacy: resolveLegacyOrganizationNarratives(profile),
    extracts,
    notes,
  }
}

export function applyApprovedMissionVisionValuesReview({
  profile,
  proposal,
  approved,
}: {
  profile: Record<string, unknown> | null | undefined
  proposal: MvvReviewProposal
  approved: Partial<Record<ReviewableNarrativeKey, boolean>>
}): {
  nextProfile: Record<string, unknown>
  applied: ReviewableNarrativeKey[]
  skipped: Record<ReviewableNarrativeKey, string>
  error?: string
} {
  const currentCombined = resolveOrganizationNarratives(profile, {
    includeLegacyFallback: false,
  }).mission
  if (hashContent(currentCombined) !== proposal.combinedContentHash) {
    return {
      nextProfile: { ...(profile ?? {}) },
      applied: [],
      skipped: { vision: "", values: "" },
      error:
        "Combined Mission content changed after review. Generate a new proposal.",
    }
  }

  const canonical = resolveOrganizationNarratives(profile, {
    includeLegacyFallback: false,
  })
  const updates: Partial<OrganizationNarratives> = {}
  const applied: ReviewableNarrativeKey[] = []
  const skipped = { vision: "", values: "" } as Record<
    ReviewableNarrativeKey,
    string
  >

  for (const key of ["vision", "values"] as const) {
    if (!approved[key]) {
      skipped[key] = "Not approved."
      continue
    }
    if (canonical[key].trim()) {
      skipped[key] = "Canonical section is already populated."
      continue
    }
    const extract = proposal.extracts[key]
    if (!extract) {
      skipped[key] = "No reliable extract is available."
      continue
    }
    updates[key] = extract.content
    applied.push(key)
  }

  return {
    nextProfile: updateOrganizationNarratives(profile, updates).nextProfile,
    applied,
    skipped,
  }
}
