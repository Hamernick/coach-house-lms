import { resolveRoadmapSections } from "@/lib/roadmap"
import type { SearchResult } from "@/lib/search/types"

import {
  DOCUMENT_LABELS,
  extractProfileValue,
  isRecord,
  matchesQuery,
} from "../helpers"
import type { SupabaseClient } from "../types"

export async function attachOrganizationImages({
  supabase,
  orgId,
  results,
}: {
  supabase: SupabaseClient
  orgId: string
  results: SearchResult[]
}) {
  const slugs = new Set<string>()
  let needsSelf = false

  for (const result of results) {
    if (result.image) continue
    if (result.href === "/organization") {
      needsSelf = true
      continue
    }

    if (result.group === "Community") {
      const match = result.href.match(/^\/([^/]+)$/)
      if (match?.[1]) slugs.add(match[1])
    }
  }

  let selfLogoUrl: string | undefined
  if (needsSelf) {
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("profile")
      .eq("user_id", orgId)
      .maybeSingle<{ profile: Record<string, unknown> | null }>()

    const profile = orgRow?.profile ?? {}
    const logoUrl = extractProfileValue(profile, "logoUrl")
    selfLogoUrl = logoUrl || undefined
  }

  const logoBySlug = new Map<string, string>()
  if (slugs.size > 0) {
    const { data: orgRows } = await supabase
      .from("organizations")
      .select("public_slug, profile")
      .in("public_slug", Array.from(slugs))
      .returns<
        Array<{
          public_slug: string | null
          profile: Record<string, unknown> | null
        }>
      >()

    for (const org of orgRows ?? []) {
      if (!org.public_slug) continue
      const profile = org.profile ?? {}
      const logoUrl = extractProfileValue(profile, "logoUrl")
      if (logoUrl) {
        logoBySlug.set(org.public_slug, logoUrl)
      }
    }
  }

  if (!selfLogoUrl && logoBySlug.size === 0) {
    return results
  }

  return results.map((result) => {
    if (result.image) return result
    if (result.href === "/organization" && selfLogoUrl) {
      return { ...result, image: selfLogoUrl }
    }
    if (result.group === "Community") {
      const match = result.href.match(/^\/([^/]+)$/)
      const slug = match?.[1]
      const logoUrl = slug ? logoBySlug.get(slug) : undefined
      if (logoUrl) {
        return { ...result, image: logoUrl }
      }
    }
    return result
  })
}

export async function addActiveOrganizationResults({
  supabase,
  orgId,
  tokens,
  pushResult,
}: {
  supabase: SupabaseClient
  orgId: string
  tokens: string[]
  pushResult: (result: SearchResult) => void
}) {
  const { data: programs } = await supabase
    .from("programs")
    .select("id, title, subtitle, status_label")
    .eq("user_id", orgId)
    .returns<
      Array<{
        id: string
        title: string | null
        subtitle: string | null
        status_label: string | null
      }>
    >()

  for (const program of programs ?? []) {
    if (
      matchesQuery(
        [program.title ?? null, program.subtitle ?? null, program.status_label ?? null],
        tokens,
      )
    ) {
      pushResult({
        id: `program:${program.id}`,
        label: program.title ?? "Untitled program",
        subtitle: program.subtitle ?? program.status_label ?? undefined,
        href: `/organization?tab=programs&programId=${program.id}`,
        group: "Programs",
      })
    }
  }

  const { data: userOrg } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", orgId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()

  if (!userOrg?.profile) return

  const profile = userOrg.profile ?? {}
  const name = extractProfileValue(profile, "name")
  const tagline = extractProfileValue(profile, "tagline")
  const mission = extractProfileValue(profile, "mission")
  const description = extractProfileValue(profile, "description")

  if (matchesQuery([name, tagline, mission, description], tokens)) {
    pushResult({
      id: `org:${orgId}`,
      label: name || "My organization",
      subtitle: "Your organization",
      href: "/organization",
      group: "My organization",
    })
  }

  const roadmapSections = resolveRoadmapSections(profile)
  for (const section of roadmapSections) {
    if (matchesQuery([section.title, section.subtitle, section.content], tokens)) {
      const sectionKey = section.slug || section.id
      pushResult({
        id: `roadmap:${orgId}:${sectionKey}`,
        label: section.title,
        subtitle: section.subtitle,
        href: `/roadmap#${sectionKey}`,
        group: "Roadmap",
      })
    }
  }

  const documents = isRecord(profile.documents)
    ? (profile.documents as Record<string, unknown>)
    : {}
  for (const [key, value] of Object.entries(documents)) {
    if (!isRecord(value)) continue
    const label = DOCUMENT_LABELS[key] ?? key
    const name = typeof value.name === "string" ? value.name : ""
    if (matchesQuery([label, name, key], tokens)) {
      pushResult({
        id: `doc:${orgId}:${key}`,
        label: name || label,
        subtitle: label,
        href: "/organization/documents",
        group: "Documents",
        keywords: [key, label].filter(Boolean),
      })
    }
  }
}
