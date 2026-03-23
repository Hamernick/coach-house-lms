import {
  normalizeWorkspaceAcceleratorResources,
  type WorkspaceAcceleratorTimelineModuleSeed,
} from "@/features/workspace-accelerator-card"
import type { OnboardingFlowDefaults } from "@/components/onboarding/onboarding-dialog/types"
import type {
  ModuleCard,
  ModuleGroup,
} from "@/lib/accelerator/progress"
import { getClassModulesForUser, type ModuleRecord } from "@/lib/modules"
import type { createSupabaseServerClient } from "@/lib/supabase"

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

type TimelineContentRow = {
  module_id: string
  video_url: string | null
  resources: unknown
}

type TimelineAssignmentRow = {
  module_id: string
}

type TimelineModuleRow = {
  id: string
  video_url: string | null
  duration_minutes: number | null
  deck_path: string | null
}

const ORGANIZATION_SETUP_MODULE_ID = "workspace-onboarding-organization-setup"
const ORGANIZATION_SETUP_TITLE_SIGNALS = new Set([
  "organization setup",
  "workspace setup",
])
const ORGANIZATION_SETUP_SLUG_SIGNALS = [
  "organization-setup",
  "workspace-setup",
  "onboarding-organization-setup",
] as const

function normalizeOrganizationSetupToken(value: string | null | undefined) {
  if (typeof value !== "string") return ""
  return value
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function hasOrganizationSetupSlugSignal(value: string | null | undefined) {
  if (typeof value !== "string") return false
  const normalized = value.trim().toLowerCase()
  if (!normalized) return false
  return ORGANIZATION_SETUP_SLUG_SIGNALS.some((signal) => normalized.includes(signal))
}

function hasOrganizationSetupTitleSignal(value: string | null | undefined) {
  const normalized = normalizeOrganizationSetupToken(value)
  if (!normalized) return false
  return ORGANIZATION_SETUP_TITLE_SIGNALS.has(normalized)
}

export function isOrganizationSetupTimelineModule({
  roadmapModule,
  moduleRecord,
}: {
  roadmapModule: Pick<ModuleCard, "id" | "slug" | "title" | "href">
  moduleRecord?: Pick<ModuleRecord, "slug" | "title"> | null
}) {
  if (roadmapModule.id === ORGANIZATION_SETUP_MODULE_ID) return true
  if (hasOrganizationSetupSlugSignal(roadmapModule.slug)) return true
  if (hasOrganizationSetupTitleSignal(roadmapModule.title)) return true
  if (typeof roadmapModule.href === "string") {
    const href = roadmapModule.href.toLowerCase()
    if (
      href.includes("source=formation-setup") ||
      href.includes("source=workspace-setup")
    ) {
      return true
    }
  }
  if (moduleRecord) {
    if (hasOrganizationSetupSlugSignal(moduleRecord.slug)) return true
    if (hasOrganizationSetupTitleSignal(moduleRecord.title)) return true
  }
  return false
}

function isIgnorableModuleSeedError(error: unknown) {
  const code = (error as { code?: string } | null)?.code
  return code === "42P01" || code === "42703" || code === "42501"
}

function resolveClassSlugFromModuleHref(href: string) {
  const match = /^\/accelerator\/class\/([^/]+)\/module\/\d+$/i.exec(href.trim())
  if (!match) return null
  return match[1] ?? null
}

async function loadModuleContextById({
  supabase,
  userId,
  classSlugs,
}: {
  supabase: SupabaseServerClient
  userId: string
  classSlugs: string[]
}) {
  const classContexts = await Promise.all(
    classSlugs.map(async (classSlug) => {
      try {
        const context = await getClassModulesForUser({
          classSlug,
          userId,
          forceAdmin: false,
          supabase,
        })
        return { classSlug, context }
      } catch (error) {
        console.error(
          `[my-organization] Unable to load class module context for ${classSlug}.`,
          error
        )
        return { classSlug, context: null }
      }
    })
  )

  const moduleContextById = new Map<string, { classTitle: string; module: ModuleRecord }>()
  for (const classContext of classContexts) {
    if (!classContext.context) continue
    for (const moduleRecord of classContext.context.modules) {
      moduleContextById.set(moduleRecord.id, {
        classTitle: classContext.context.classTitle,
        module: moduleRecord,
      })
    }
  }

  return moduleContextById
}

async function loadTimelineModuleRows({
  supabase,
  moduleIds,
}: {
  supabase: SupabaseServerClient
  moduleIds: string[]
}) {
  if (moduleIds.length === 0) {
    return {
      contentRows: [] as TimelineContentRow[],
      assignmentRows: [] as TimelineAssignmentRow[],
      moduleRows: [] as TimelineModuleRow[],
    }
  }

  const [timelineContentResult, timelineAssignmentsResult, timelineModulesResult] =
    await Promise.all([
      supabase
        .from("module_content")
        .select("module_id, video_url, resources")
        .in("module_id", moduleIds)
        .returns<TimelineContentRow[]>(),
      supabase
        .from("module_assignments")
        .select("module_id")
        .in("module_id", moduleIds)
        .returns<TimelineAssignmentRow[]>(),
      supabase
        .from("modules")
        .select("id, video_url, duration_minutes, deck_path")
        .in("id", moduleIds)
        .returns<TimelineModuleRow[]>(),
    ])

  if (
    timelineContentResult.error &&
    !isIgnorableModuleSeedError(timelineContentResult.error)
  ) {
    console.error(
      "[my-organization] Unable to load accelerator timeline content.",
      timelineContentResult.error
    )
  }
  if (
    timelineAssignmentsResult.error &&
    !isIgnorableModuleSeedError(timelineAssignmentsResult.error)
  ) {
    console.error(
      "[my-organization] Unable to load accelerator timeline assignments.",
      timelineAssignmentsResult.error
    )
  }
  if (
    timelineModulesResult.error &&
    !isIgnorableModuleSeedError(timelineModulesResult.error)
  ) {
    console.error(
      "[my-organization] Unable to load accelerator timeline module metadata.",
      timelineModulesResult.error
    )
  }

  return {
    contentRows: timelineContentResult.data ?? [],
    assignmentRows: timelineAssignmentsResult.data ?? [],
    moduleRows: timelineModulesResult.data ?? [],
  }
}

function buildModuleSeed({
  roadmapModule,
  groupMetaById,
  contentByModuleId,
  moduleMetaById,
  modulesWithAssignments,
  moduleContextById,
  onboardingDefaults,
}: {
  roadmapModule: ModuleCard
  groupMetaById: Map<string, { title: string; order: number }>
  contentByModuleId: Map<string, { videoUrl: string | null; resources: unknown }>
  moduleMetaById: Map<
    string,
    { videoUrl: string | null; durationMinutes: number | null; hasDeck: boolean }
  >
  modulesWithAssignments: Set<string>
  moduleContextById: Map<string, { classTitle: string; module: ModuleRecord }>
  onboardingDefaults?: OnboardingFlowDefaults | null
}): WorkspaceAcceleratorTimelineModuleSeed {
  const content = contentByModuleId.get(roadmapModule.id)
  const meta = moduleMetaById.get(roadmapModule.id)
  const moduleContextEntry = moduleContextById.get(roadmapModule.id)
  const groupMeta = groupMetaById.get(roadmapModule.id)
  const moduleRecord = moduleContextEntry?.module
  const resourcesFromModuleRecord = (moduleRecord?.resources ?? []).map(
    (resource, index) => ({
      id: `resource-${roadmapModule.id}-${index + 1}`,
      title: resource.label,
      url: resource.url,
      kind: resource.provider,
    })
  )
  const resources = normalizeWorkspaceAcceleratorResources(
    resourcesFromModuleRecord.length > 0
      ? resourcesFromModuleRecord
      : content?.resources ?? []
  )
  const videoUrl = moduleRecord?.videoUrl ?? content?.videoUrl ?? meta?.videoUrl ?? null
  const isOrganizationSetupModule = isOrganizationSetupTimelineModule({
    roadmapModule,
    moduleRecord,
  })
  const moduleContext = isOrganizationSetupModule
    ? {
        classTitle: moduleContextEntry?.classTitle ?? groupMeta?.title ?? "Formation",
        lessonNotesContent: moduleRecord?.contentMd ?? null,
        moduleResources: moduleRecord?.resources ?? [],
        assignmentFields: moduleRecord?.assignment?.fields ?? [],
        assignmentSubmission: moduleRecord?.assignmentSubmission ?? null,
        completeOnSubmit: Boolean(moduleRecord?.assignment?.completeOnSubmit),
        workspaceOnboarding: {
          view: "organization-setup" as const,
              defaults: onboardingDefaults
                ? {
                    ...onboardingDefaults,
                    defaultIntentFocus: "build" as const,
                  }
                : null,
        },
      }
    : moduleRecord
      ? {
          classTitle: moduleContextEntry?.classTitle ?? "Accelerator",
          lessonNotesContent: moduleRecord.contentMd ?? null,
          moduleResources: moduleRecord.resources,
          assignmentFields: moduleRecord.assignment?.fields ?? [],
          assignmentSubmission: moduleRecord.assignmentSubmission ?? null,
          completeOnSubmit: Boolean(moduleRecord.assignment?.completeOnSubmit),
        }
      : null

  return {
    id: roadmapModule.id,
    slug: roadmapModule.slug,
    title: isOrganizationSetupModule ? "Organization setup" : roadmapModule.title,
    description: roadmapModule.description ?? null,
    href: roadmapModule.href,
    status: roadmapModule.status,
    groupTitle: groupMeta?.title ?? "Accelerator",
    groupOrder: groupMeta?.order ?? null,
    videoUrl,
    durationMinutes: moduleRecord?.durationMinutes ?? meta?.durationMinutes ?? null,
    resources,
    hasAssignment:
      modulesWithAssignments.has(roadmapModule.id) ||
      Boolean((moduleRecord?.assignment?.fields.length ?? 0) > 0),
    hasDeck: Boolean(meta?.hasDeck ?? moduleRecord?.hasDeck),
    moduleContext,
  }
}

export function buildModuleGroupMetaById(
  groups: ModuleGroup[]
): Map<string, { title: string; order: number }> {
  const lookup = new Map<string, { title: string; order: number }>()
  groups.forEach((group, groupIndex) => {
    for (const groupModule of group.modules) {
      lookup.set(groupModule.id, { title: group.title, order: groupIndex })
    }
  })
  return lookup
}

export async function buildAcceleratorTimelineModules({
  supabase,
  userId,
  sortedRoadmapModules,
  groupMetaById,
  onboardingDefaults = null,
}: {
  supabase: SupabaseServerClient
  userId: string
  sortedRoadmapModules: ModuleCard[]
  groupMetaById: Map<string, { title: string; order: number }>
  onboardingDefaults?: OnboardingFlowDefaults | null
}) {
  const timelineModuleIds = sortedRoadmapModules.map((roadmapModule) => roadmapModule.id)
  const timelineClassSlugs = Array.from(
    new Set(
      sortedRoadmapModules
        .map((roadmapModule) => resolveClassSlugFromModuleHref(roadmapModule.href))
        .filter((slug): slug is string => Boolean(slug))
    )
  )

  const moduleContextById = await loadModuleContextById({
    supabase,
    userId,
    classSlugs: timelineClassSlugs,
  })
  const { contentRows, assignmentRows, moduleRows } = await loadTimelineModuleRows({
    supabase,
    moduleIds: timelineModuleIds,
  })

  const contentByModuleId = new Map<string, { videoUrl: string | null; resources: unknown }>()
  for (const row of contentRows) {
    contentByModuleId.set(row.module_id, {
      videoUrl: row.video_url ?? null,
      resources: row.resources,
    })
  }
  const moduleMetaById = new Map<
    string,
    { videoUrl: string | null; durationMinutes: number | null; hasDeck: boolean }
  >()
  for (const row of moduleRows) {
    moduleMetaById.set(row.id, {
      videoUrl: row.video_url ?? null,
      durationMinutes:
        typeof row.duration_minutes === "number" ? row.duration_minutes : null,
      hasDeck: Boolean(row.deck_path),
    })
  }
  const modulesWithAssignments = new Set(assignmentRows.map((row) => row.module_id))

  const roadmapModuleSeeds = sortedRoadmapModules.map((roadmapModule) =>
    buildModuleSeed({
      roadmapModule,
      groupMetaById,
      contentByModuleId,
      moduleMetaById,
      modulesWithAssignments,
      moduleContextById,
      onboardingDefaults,
    }),
  )

  return roadmapModuleSeeds
}
