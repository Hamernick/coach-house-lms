import { fetchSidebarTree } from "@/lib/academy"
import { parseAssignmentFields } from "@/lib/modules"
import { resolveRoadmapSections } from "@/lib/roadmap"
import type { SearchResult } from "@/lib/search/types"

import {
  DOCUMENT_LABELS,
  extractProfileValue,
  formatClassTitle,
  isRecord,
  matchesQuery,
} from "../helpers"
import type { SupabaseClient } from "../types"

type AddFallbackResultsParams = {
  supabase: SupabaseClient
  orgId: string
  isAdmin: boolean
  tokens: string[]
  pushResult: (result: SearchResult) => void
}

type AddClassAndModuleResultsParams = {
  tokens: string[]
  isAdmin: boolean
  pushResult: (result: SearchResult) => void
}

async function addClassAndModuleResults({
  tokens,
  isAdmin,
  pushResult,
}: AddClassAndModuleResultsParams): Promise<void> {
  const classes = await fetchSidebarTree({
    includeDrafts: isAdmin,
    forceAdmin: isAdmin,
  })

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
          [
            klassModule.title,
            klassModule.description ?? null,
            `${klassModule.index}`,
            classTitle,
            klass.slug,
          ],
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
}

async function addQuestionResults({
  supabase,
  tokens,
  pushResult,
}: {
  supabase: SupabaseClient
  tokens: string[]
  pushResult: (result: SearchResult) => void
}): Promise<void> {
  const { data: assignmentRows } = await supabase
    .from("module_assignments")
    .select(
      "module_id, schema, modules ( id, title, idx, index_in_class, classes ( id, slug, title ) )",
    )
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
}

async function addProgramResults({
  supabase,
  orgId,
  tokens,
  pushResult,
}: {
  supabase: SupabaseClient
  orgId: string
  tokens: string[]
  pushResult: (result: SearchResult) => void
}): Promise<void> {
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
}

async function addMyOrganizationResults({
  supabase,
  orgId,
  tokens,
  pushResult,
}: {
  supabase: SupabaseClient
  orgId: string
  tokens: string[]
  pushResult: (result: SearchResult) => void
}): Promise<void> {
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

  if (!userOrg?.profile) {
    return
  }

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
      href: "/organization",
      group: "My organization",
      image: logoUrl || undefined,
      keywords: [tagline, mission, description].filter(Boolean),
    })
  }

  const roadmapSections = resolveRoadmapSections(profile)
  for (const section of roadmapSections) {
    if (
      matchesQuery([section.title, section.subtitle, section.content], tokens)
    ) {
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

  const documents = isRecord(profile.documents)
    ? (profile.documents as Record<string, unknown>)
    : {}
  for (const [key, value] of Object.entries(documents)) {
    if (!isRecord(value)) continue
    const label = DOCUMENT_LABELS[key] ?? key
    const name = typeof value.name === "string" ? value.name : ""
    if (matchesQuery([label, name, key], tokens)) {
      pushResult({
        id: `doc:${userOrg.user_id}:${key}`,
        label: name || label,
        subtitle: label,
        href: "/organization/documents",
        group: "Documents",
        keywords: [key, label].filter(Boolean),
      })
    }
  }
}

async function addCommunityResults({
  supabase,
  tokens,
  pushResult,
}: {
  supabase: SupabaseClient
  tokens: string[]
  pushResult: (result: SearchResult) => void
}): Promise<void> {
  const { data: publicOrgs } = await supabase
    .from("organizations")
    .select("user_id, public_slug, profile")
    .eq("is_public", true)
    .not("public_slug", "is", null)
    .limit(120)
    .returns<
      Array<{
        user_id: string
        public_slug: string | null
        profile: Record<string, unknown> | null
      }>
    >()

  for (const org of publicOrgs ?? []) {
    const profile = org.profile ?? {}
    const name = extractProfileValue(profile, "name")
    const tagline = extractProfileValue(profile, "tagline")
    const mission = extractProfileValue(profile, "mission")
    const description = extractProfileValue(profile, "description")
    const city = extractProfileValue(profile, "address_city")
    const state = extractProfileValue(profile, "address_state")
    if (
      matchesQuery(
        [
          name,
          tagline,
          mission,
          description,
          org.public_slug ?? "",
          city,
          state,
        ],
        tokens,
      )
    ) {
      const location = [city, state].filter(Boolean).join(", ")
      const logoUrl = extractProfileValue(profile, "logoUrl")
      pushResult({
        id: `org-public-${org.user_id}`,
        label: name || org.public_slug || "Organization",
        subtitle: tagline || location || "Community organization",
        href: `/find/${org.public_slug}`,
        group: "Community",
        image: logoUrl || undefined,
        keywords: [org.public_slug ?? "", tagline, location].filter(Boolean),
      })
    }
  }
}

export async function addFallbackResults({
  supabase,
  orgId,
  isAdmin,
  tokens,
  pushResult,
}: AddFallbackResultsParams): Promise<void> {
  await addClassAndModuleResults({ tokens, isAdmin, pushResult })
  await addQuestionResults({ supabase, tokens, pushResult })
  await addProgramResults({ supabase, orgId, tokens, pushResult })
  await addMyOrganizationResults({ supabase, orgId, tokens, pushResult })
  await addCommunityResults({ supabase, tokens, pushResult })
}
