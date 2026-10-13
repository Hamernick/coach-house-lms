import type { SupabaseClient } from "@supabase/supabase-js"

import type { SidebarClass } from "@/lib/academy"
import { fetchSidebarTree } from "@/lib/academy"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import type { Json } from "@/lib/supabase/schema/json"
import type { Database } from "@/lib/supabase/types"

export type ModuleCardStatus = "not_started" | "in_progress" | "completed"

export type ModuleCard = {
  id: string
  slug: string
  title: string
  description: string | null
  href: string
  status: ModuleCardStatus
  index: number
  hasNotes: boolean
}

export type ModuleGroup = {
  id: string
  title: string
  description: string | null
  slug: string
  modules: ModuleCard[]
}

export type AcceleratorProgressSummary = {
  groups: ModuleGroup[]
  totalModules: number
  completedModules: number
  inProgressModules: number
  percent: number
}

type ProgressOptions = {
  supabase?: SupabaseClient<Database, "public">
  userId?: string
  isAdmin?: boolean
  classes?: SidebarClass[]
  basePath?: string
}

const LEGACY_CLASS_TITLES = new Set(["published class"])
const LEGACY_CLASS_SLUGS = new Set(["published-class"])

function isLegacyClass(klass: SidebarClass): boolean {
  const title = klass.title.trim().toLowerCase()
  const slug = klass.slug.trim().toLowerCase()
  return LEGACY_CLASS_TITLES.has(title) || LEGACY_CLASS_SLUGS.has(slug)
}

function normalizeClassesForProgress(classes: SidebarClass[], isAdmin: boolean): SidebarClass[] {
  if (isAdmin) return classes
  return classes
    .filter((klass) => klass.published)
    .map((klass) => ({
      ...klass,
      modules: klass.modules.filter((module) => module.published),
    }))
}

function buildModuleGroups({
  classes,
  progressMap,
  notesMap,
  basePath,
}: {
  classes: SidebarClass[]
  progressMap: Map<string, ModuleCardStatus>
  notesMap: Map<string, boolean>
  basePath: string
}): ModuleGroup[] {
  return classes
    .map((klass) => {
      const modules = klass.modules.map((module) => {
        const status = progressMap.get(module.id) ?? "not_started"
        return {
          id: module.id,
          slug: module.slug ?? module.id,
          title: module.title,
          description: module.description ?? null,
          href: `${basePath}/class/${klass.slug}/module/${module.index}`,
          status,
          index: module.index,
          hasNotes: notesMap.get(module.id) === true,
        }
      })

      return {
        id: klass.id,
        title: klass.title,
        description: klass.description ?? null,
        slug: klass.slug,
        modules,
      }
    })
    .filter((group) => group.modules.length > 0)
}

function hasSavedNotes(value: Json | null | undefined): boolean {
  if (typeof value === "string") return value.trim().length > 0
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const content = (value as Record<string, unknown>).content
  return typeof content === "string" && content.trim().length > 0
}

function normalizeModuleProgressStatus(value: string | null | undefined): ModuleCardStatus {
  if (value === "completed" || value === "in_progress") return value
  return "not_started"
}

export async function fetchAcceleratorProgressSummary({
  supabase: supabaseOverride,
  userId,
  isAdmin,
  classes,
  basePath = "/accelerator",
}: ProgressOptions = {}): Promise<AcceleratorProgressSummary> {
  const supabase = supabaseOverride ?? (await createSupabaseServerClient())
  let resolvedUserId = userId
  let resolvedIsAdmin = isAdmin

  if (!resolvedUserId) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError && !isSupabaseAuthSessionMissingError(userError)) {
      console.error("[accelerator-progress] Unable to load Supabase user.", userError)
      return { groups: [], totalModules: 0, completedModules: 0, inProgressModules: 0, percent: 0 }
    }
    if (!user) {
      return { groups: [], totalModules: 0, completedModules: 0, inProgressModules: 0, percent: 0 }
    }
    resolvedUserId = user.id
  }

  if (resolvedIsAdmin == null) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", resolvedUserId)
      .maybeSingle<{ role: string | null }>()
    resolvedIsAdmin = profile?.role === "admin"
  }

  const classSource =
    classes ?? (await fetchSidebarTree({ includeDrafts: Boolean(resolvedIsAdmin), forceAdmin: Boolean(resolvedIsAdmin) }))

  const normalizedClasses = normalizeClassesForProgress(classSource, Boolean(resolvedIsAdmin))
  const filteredClasses = normalizedClasses.filter((klass) => !isLegacyClass(klass))
  const moduleIds = filteredClasses.flatMap((klass) => klass.modules.map((module) => module.id))

  if (moduleIds.length === 0) {
    return { groups: [], totalModules: 0, completedModules: 0, inProgressModules: 0, percent: 0 }
  }

  const [progressResult, submissionResult, assignmentResult] = await Promise.all([
    supabase
      .from("module_progress")
      .select("module_id, status, notes")
      .eq("user_id", resolvedUserId)
      .in("module_id", moduleIds)
      .returns<Array<{ module_id: string; status: ModuleCardStatus; notes: Json | null }>>(),
    supabase
      .from("assignment_submissions")
      .select("module_id, status")
      .eq("user_id", resolvedUserId)
      .in("module_id", moduleIds)
      .returns<Array<{ module_id: string; status: string | null }>>(),
    supabase
      .from("module_assignments")
      .select("module_id, complete_on_submit")
      .in("module_id", moduleIds)
      .returns<Array<{ module_id: string; complete_on_submit: boolean | null }>>(),
  ])

  if (progressResult.error) {
    const code = (progressResult.error as { code?: string }).code
    if (code !== "42P01" && code !== "42703") {
      console.error("[accelerator-progress] Unable to load module progress.", progressResult.error)
    }
  }
  if (submissionResult.error) {
    const code = (submissionResult.error as { code?: string }).code
    if (code !== "42P01" && code !== "42703") {
      console.error("[accelerator-progress] Unable to load assignment submissions.", submissionResult.error)
    }
  }
  if (assignmentResult.error) {
    const code = (assignmentResult.error as { code?: string }).code
    if (code !== "42P01" && code !== "42703") {
      console.error("[accelerator-progress] Unable to load module assignments.", assignmentResult.error)
    }
  }

  const progressMap = new Map<string, ModuleCardStatus>()
  const notesMap = new Map<string, boolean>()
  const progressStatusByModuleId = new Map<string, ModuleCardStatus>()
  const submissionStatusByModuleId = new Map<string, string>()
  const completeOnSubmit = new Set<string>()

  for (const row of progressResult.error ? [] : progressResult.data ?? []) {
    progressStatusByModuleId.set(row.module_id, normalizeModuleProgressStatus(row.status))
    notesMap.set(row.module_id, hasSavedNotes(row.notes))
  }

  for (const row of submissionResult.error ? [] : submissionResult.data ?? []) {
    if (!row.status) continue
    submissionStatusByModuleId.set(row.module_id, row.status)
  }

  for (const row of assignmentResult.error ? [] : assignmentResult.data ?? []) {
    if (row.complete_on_submit) {
      completeOnSubmit.add(row.module_id)
    }
  }

  let completedModules = 0
  let inProgressModules = 0

  for (const moduleId of moduleIds) {
    const progressStatus = progressStatusByModuleId.get(moduleId)
    if (progressStatus && progressStatus !== "not_started") {
      progressMap.set(moduleId, progressStatus)
      if (progressStatus === "completed") completedModules += 1
      if (progressStatus === "in_progress") inProgressModules += 1
      continue
    }

    const submissionStatus = submissionStatusByModuleId.get(moduleId)
    if (!submissionStatus) continue

    const completed = completeOnSubmit.has(moduleId) && submissionStatus !== "revise"
    const status: ModuleCardStatus = completed ? "completed" : "in_progress"
    progressMap.set(moduleId, status)
    if (status === "completed") completedModules += 1
    if (status === "in_progress") inProgressModules += 1
  }

  const groups = buildModuleGroups({
    classes: filteredClasses,
    progressMap,
    notesMap,
    basePath,
  })

  const totalModules = moduleIds.length
  const percent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0

  return { groups, totalModules, completedModules, inProgressModules, percent }
}
