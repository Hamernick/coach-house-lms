import { NextResponse } from "next/server"

import { fetchSidebarTree } from "@/lib/academy"
import { CATEGORIES, ITEMS, type MarketplaceCategory } from "@/lib/marketplace/data"
import { parseAssignmentFields } from "@/lib/modules"
import { resolveRoadmapSections } from "@/lib/roadmap"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import { fetchLearningEntitlements } from "@/lib/accelerator/entitlements"
import type { SearchResult } from "@/lib/search/types"
import { createSupabaseServerClient } from "@/lib/supabase"

const MIN_QUERY_LENGTH = 2
const MAX_RESULTS = 30
const SESSION_TITLE_PATTERNS = [
  /^session\s+\d+\s*[\u2013-]\s*/i,
  /^session\s+[a-z]\d+\s*[\u2013-]\s*/i,
]

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

type SearchRow = {
  id: string
  label: string
  subtitle: string | null
  href: string
  group_name: string
  rank: number | null
}

function formatClassTitle(title: string) {
  const match = title.match(/^Session\s+[A-Za-z]\d+\s*[\u2013-]\s*(.+)$/i)
  if (match) return match[1].trim()
  return title
}

function normalizeQuery(query: string) {
  return query.toLowerCase().split(/\s+/).filter(Boolean)
}

function matchesQuery(values: Array<string | null | undefined>, tokens: string[]) {
  if (tokens.length === 0) return false
  const haystack = values.filter(Boolean).join(" ").toLowerCase()
  return tokens.every((token) => haystack.includes(token))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function marketplaceCategoryLabel(category: MarketplaceCategory | undefined) {
  if (!category) return null
  return CATEGORIES.find((item) => item.value === category)?.label ?? null
}

function buildMarketplaceHref(category: MarketplaceCategory | undefined, name: string) {
  const params = new URLSearchParams()
  if (category) params.set("category", category)
  params.set("q", name)
  return `/marketplace?${params.toString()}`
}

function extractProfileValue(profile: Record<string, unknown>, key: string) {
  const value = profile[key]
  if (typeof value === "string") return value
  return ""
}

const DOCUMENT_LABELS: Record<string, string> = {
  verificationLetter: "501(c)(3) determination letter",
  articlesOfIncorporation: "Articles of incorporation",
  bylaws: "Bylaws",
  stateRegistration: "State registration",
  goodStandingCertificate: "Certificate of good standing",
  w9: "W-9 form",
  taxExemptCertificate: "Tax exempt certificate",
}

function isSessionTitle(title: string) {
  return SESSION_TITLE_PATTERNS.some((pattern) => pattern.test(title))
}

function extractClassSlug(href: string) {
  const match = href.match(/\/accelerator\/class\/([^/]+)/)
  return match?.[1] ?? null
}

function shouldOmitSearchRow(row: SearchRow) {
  const classSlug = extractClassSlug(row.href)
  if (classSlug && /^session-e\d+/i.test(classSlug)) return true

  if (row.group_name === "Classes") {
    return isSessionTitle(row.label)
  }

  if (row.group_name === "Modules") {
    return row.subtitle ? isSessionTitle(row.subtitle) : false
  }

  if (row.group_name === "Questions") {
    const classTitle = row.subtitle?.split(" · ")[0] ?? ""
    return isSessionTitle(classTitle)
  }

  return false
}

function formatSearchRow(row: SearchRow): SearchResult {
  let label = row.label
  let subtitle = row.subtitle ?? undefined

  if (row.group_name === "Classes") {
    label = formatClassTitle(row.label)
  }

  if (row.group_name === "Modules" && subtitle) {
    subtitle = formatClassTitle(subtitle)
  }

  if (row.group_name === "Questions" && subtitle?.includes(" · ")) {
    const [classTitle, moduleTitle] = subtitle.split(" · ")
    subtitle = moduleTitle ? `${formatClassTitle(classTitle)} · ${moduleTitle}` : subtitle
  }

  return {
    id: row.id,
    label,
    subtitle,
    href: row.href,
    group: row.group_name,
  }
}

async function attachOrganizationImages({
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
    if (result.href === "/my-organization") {
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
      .returns<Array<{ public_slug: string | null; profile: Record<string, unknown> | null }>>()

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
    if (result.href === "/my-organization" && selfLogoUrl) {
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

async function fetchIsAdmin(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: string | null }>()
  return profile?.role === "admin"
}

async function addActiveOrganizationResults({
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
    .returns<Array<{ id: string; title: string | null; subtitle: string | null; status_label: string | null }>>()

  for (const program of programs ?? []) {
    if (matchesQuery([program.title ?? null, program.subtitle ?? null, program.status_label ?? null], tokens)) {
      pushResult({
        id: `program:${program.id}`,
        label: program.title ?? "Untitled program",
        subtitle: program.subtitle ?? program.status_label ?? undefined,
        href: `/my-organization?tab=programs&programId=${program.id}`,
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
      href: "/my-organization",
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

  const documents = isRecord(profile["documents"]) ? (profile["documents"] as Record<string, unknown>) : {}
  for (const [key, value] of Object.entries(documents)) {
    if (!isRecord(value)) continue
    const label = DOCUMENT_LABELS[key] ?? key
    const name = typeof value.name === "string" ? value.name : ""
    if (matchesQuery([label, name, key], tokens)) {
      pushResult({
        id: `doc:${orgId}:${key}`,
        label: name || label,
        subtitle: label,
        href: "/my-organization/documents",
        group: "Documents",
        keywords: [key, label].filter(Boolean),
      })
    }
  }
}

async function addFallbackResults({
  supabase,
  orgId,
  isAdmin,
  tokens,
  pushResult,
}: {
  supabase: SupabaseClient
  orgId: string
  isAdmin: boolean
  tokens: string[]
  pushResult: (result: SearchResult) => void
}) {
  const classes = await fetchSidebarTree({ includeDrafts: isAdmin, forceAdmin: isAdmin })
  for (const klass of classes) {
    const classTitle = formatClassTitle(klass.title)
    if (matchesQuery([classTitle, klass.description ?? null, klass.slug], tokens)) {
      const firstModuleIndex = klass.modules[0]?.index ?? 1
      pushResult({
        id: `class-${klass.id}`,
        label: classTitle,
        subtitle: "Class",
        href: `/accelerator/class/${klass.slug}/module/${firstModuleIndex}`,
        group: "Classes",
        keywords: [klass.slug],
      })
    }

    for (const klassModule of klass.modules) {
      if (
        matchesQuery(
          [klassModule.title, klassModule.description ?? null, `${klassModule.index}`, classTitle, klass.slug],
          tokens,
        )
      ) {
        pushResult({
          id: `module-${klassModule.id}`,
          label: klassModule.title,
          subtitle: classTitle,
          href: `/accelerator/class/${klass.slug}/module/${klassModule.index}`,
          group: "Modules",
          keywords: [classTitle, klass.slug, `${klassModule.index}`],
        })
      }
    }
  }

  const { data: assignmentRows } = await supabase
    .from("module_assignments")
    .select("module_id, schema, modules ( id, title, idx, index_in_class, classes ( id, slug, title ) )")
    .returns<
      Array<{
        module_id: string
        schema: unknown
        modules: {
          id: string
          title: string
          idx: number | null
          index_in_class: number | null
          classes: { id: string; slug: string; title: string } | null
        } | null
      }>
    >()

  for (const row of assignmentRows ?? []) {
    const moduleRow = row.modules
    const klass = moduleRow?.classes
    if (!moduleRow || !klass) continue
    const classTitle = formatClassTitle(klass.title)
    const moduleIndex = moduleRow.index_in_class ?? moduleRow.idx ?? 1
    const fields = parseAssignmentFields(row.schema)
    for (const field of fields) {
      if (matchesQuery([field.label, field.description ?? null, field.name], tokens)) {
        pushResult({
          id: `question-${row.module_id}-${field.name}`,
          label: field.label,
          subtitle: `${classTitle} · ${moduleRow.title}`,
          href: `/accelerator/class/${klass.slug}/module/${moduleIndex}`,
          group: "Questions",
          keywords: [moduleRow.title, classTitle, field.name],
        })
      }
    }
  }

  const { data: programs } = await supabase
    .from("programs")
    .select("id, title, subtitle, status_label")
    .eq("user_id", orgId)
    .returns<Array<{ id: string; title: string | null; subtitle: string | null; status_label: string | null }>>()

  for (const program of programs ?? []) {
    if (matchesQuery([program.title ?? null, program.subtitle ?? null, program.status_label ?? null], tokens)) {
      pushResult({
        id: `program:${program.id}`,
        label: program.title ?? "Untitled program",
        subtitle: program.subtitle ?? program.status_label ?? undefined,
        href: `/my-organization?tab=programs&programId=${program.id}`,
        group: "Programs",
      })
    }
  }

  const { data: userOrg } = await supabase
    .from("organizations")
    .select("user_id, public_slug, is_public, profile")
    .eq("user_id", orgId)
    .maybeSingle<{
      user_id: string
      public_slug: string | null
      is_public: boolean | null
      profile: Record<string, unknown> | null
    }>()

  if (userOrg?.profile) {
    const profile = userOrg.profile ?? {}
    const name = extractProfileValue(profile, "name")
    const tagline = extractProfileValue(profile, "tagline")
    const mission = extractProfileValue(profile, "mission")
    const description = extractProfileValue(profile, "description")
    if (matchesQuery([name, tagline, mission, description], tokens)) {
      const logoUrl = extractProfileValue(profile, "logoUrl")
      pushResult({
        id: `org:${userOrg.user_id}`,
        label: name || "My organization",
        subtitle: "Your organization",
        href: "/my-organization",
        group: "My organization",
        image: logoUrl || undefined,
        keywords: [tagline, mission, description].filter(Boolean),
      })
    }

    const roadmapSections = resolveRoadmapSections(profile)
    for (const section of roadmapSections) {
      if (matchesQuery([section.title, section.subtitle, section.content], tokens)) {
        const sectionKey = section.slug || section.id
        pushResult({
          id: `roadmap:${userOrg.user_id}:${sectionKey}`,
          label: section.title,
          subtitle: section.subtitle,
          href: `/roadmap#${sectionKey}`,
          group: "Roadmap",
          keywords: [section.content].filter(Boolean),
        })
      }
    }

    const documents = isRecord(profile["documents"]) ? (profile["documents"] as Record<string, unknown>) : {}
    for (const [key, value] of Object.entries(documents)) {
      if (!isRecord(value)) continue
      const label = DOCUMENT_LABELS[key] ?? key
      const name = typeof value.name === "string" ? value.name : ""
      if (matchesQuery([label, name, key], tokens)) {
        pushResult({
          id: `doc:${userOrg.user_id}:${key}`,
          label: name || label,
          subtitle: label,
          href: "/my-organization/documents",
          group: "Documents",
          keywords: [key, label].filter(Boolean),
        })
      }
    }
  }

  const { data: publicOrgs } = await supabase
    .from("organizations")
    .select("user_id, public_slug, profile")
    .eq("is_public", true)
    .not("public_slug", "is", null)
    .limit(120)
    .returns<Array<{
      user_id: string
      public_slug: string | null
      profile: Record<string, unknown> | null
    }>>()

  for (const org of publicOrgs ?? []) {
    const profile = org.profile ?? {}
    const name = extractProfileValue(profile, "name")
    const tagline = extractProfileValue(profile, "tagline")
    const mission = extractProfileValue(profile, "mission")
    const description = extractProfileValue(profile, "description")
    const city = extractProfileValue(profile, "address_city")
    const state = extractProfileValue(profile, "address_state")
    if (matchesQuery([name, tagline, mission, description, org.public_slug ?? "", city, state], tokens)) {
      const location = [city, state].filter(Boolean).join(", ")
      const logoUrl = extractProfileValue(profile, "logoUrl")
      pushResult({
        id: `org-public-${org.user_id}`,
        label: name || org.public_slug || "Organization",
        subtitle: tagline || location || "Community organization",
        href: `/${org.public_slug}`,
        group: "Community",
        image: logoUrl || undefined,
        keywords: [org.public_slug ?? "", tagline, location].filter(Boolean),
      })
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawQuery = (searchParams.get("q") ?? "").trim()
  if (rawQuery.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ results: [] })
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ results: [] }, { status: 401 })
  }

  const { orgId } = await resolveActiveOrganization(supabase, user.id)

  const isAdmin = await fetchIsAdmin(supabase, user.id)
  const entitlements = await fetchLearningEntitlements({
    supabase,
    userId: user.id,
    orgUserId: orgId,
    isAdmin,
  })
  const hasAcceleratorAccess = entitlements.hasAcceleratorAccess || entitlements.hasElectiveAccess

  const tokens = normalizeQuery(rawQuery)
  const results: SearchResult[] = []
  const seen = new Set<string>()

  const pushResult = (result: SearchResult) => {
    if (results.length >= MAX_RESULTS) return
    if (seen.has(result.id)) return
    seen.add(result.id)
    results.push(result)
  }

  const { data: rankedResults, error: rankedError } = await supabase
    .rpc("search_global", {
      p_query: rawQuery,
      p_user_id: user.id,
      p_is_admin: isAdmin,
      p_limit: MAX_RESULTS,
    })
    .returns<SearchRow[]>()

  if (!rankedError) {
    for (const row of rankedResults ?? []) {
      if (shouldOmitSearchRow(row)) continue
      pushResult(formatSearchRow(row))
    }
    if (orgId !== user.id) {
      await addActiveOrganizationResults({ supabase, orgId, tokens, pushResult })
    }
  } else {
    await addFallbackResults({ supabase, orgId, isAdmin, tokens, pushResult })
  }

  for (const item of ITEMS) {
    const primaryCategory = item.category[0]
    const categoryLabel = marketplaceCategoryLabel(primaryCategory)
    const searchableCategories = item.category
      .map((category) => marketplaceCategoryLabel(category))
      .filter(Boolean) as string[]
    if (
      matchesQuery(
        [item.name, item.description, item.byline ?? null, ...searchableCategories],
        tokens,
      )
    ) {
      pushResult({
        id: `marketplace-${item.id}`,
        label: item.name,
        subtitle: item.byline ?? categoryLabel ?? undefined,
        href: buildMarketplaceHref(primaryCategory, item.name),
        group: "Marketplace",
        image: item.image,
        keywords: [item.description, item.byline ?? "", ...(searchableCategories ?? [])].filter(Boolean),
      })
    }
  }

  const filtered = hasAcceleratorAccess
    ? results
    : results.filter((item) => !item.href.startsWith("/accelerator"))

  try {
    const trimmed = rawQuery.slice(0, 200)
    await supabase.from("search_events").insert({
      user_id: user.id,
      event_type: "query",
      query: trimmed,
      query_length: trimmed.length,
      context: searchParams.get("context"),
      result_count: filtered.length,
    })
  } catch {
    // Best-effort analytics; ignore failures.
  }

  const enriched = await attachOrganizationImages({ supabase, orgId, results: filtered })
  return NextResponse.json({ results: enriched })
}
