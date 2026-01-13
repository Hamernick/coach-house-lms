import type { SupabaseClient } from "@supabase/supabase-js"

import type { SidebarClass } from "@/lib/academy"
import { fetchSidebarTree } from "@/lib/academy"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import type { Database } from "@/lib/supabase/types"

export type ModuleCardStatus = "locked" | "not_started" | "in_progress" | "completed"

export type ModuleCard = {
  id: string
  title: string
  description: string | null
  href: string
  status: ModuleCardStatus
  index: number
}

export type ModuleGroup = {
  id: string
  title: string
  description: string | null
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
  basePath,
}: {
  classes: SidebarClass[]
  progressMap: Map<string, ModuleCardStatus>
  basePath: string
}): ModuleGroup[] {
  return classes
    .map((klass) => {
      let unlocked = true
      const modules = klass.modules.map((module) => {
        const statusFromProgress = progressMap.get(module.id) ?? "not_started"
        let status: ModuleCardStatus = statusFromProgress
        if (!unlocked) {
          status = "locked"
        }
        if (unlocked && statusFromProgress === "not_started") {
          unlocked = false
        }
        return {
          id: module.id,
          title: module.title,
          description: module.description ?? null,
          href: `${basePath}/class/${klass.slug}/module/${module.index}`,
          status,
          index: module.index,
        }
      })

      return {
        id: klass.id,
        title: klass.title,
        description: klass.description ?? null,
        modules,
      }
    })
    .filter((group) => group.modules.length > 0)
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
    if (userError && !isSupabaseAuthSessionMissingError(userError)) throw userError
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
  const moduleIds = normalizedClasses.flatMap((klass) => klass.modules.map((module) => module.id))

  if (moduleIds.length === 0) {
    return { groups: [], totalModules: 0, completedModules: 0, inProgressModules: 0, percent: 0 }
  }

  const { data: progressRows, error: progressError } = await supabase
    .from("module_progress")
    .select("module_id, status")
    .eq("user_id", resolvedUserId)
    .in("module_id", moduleIds)
    .returns<Array<{ module_id: string; status: ModuleCardStatus }>>()

  if (progressError) {
    throw progressError
  }

  const progressMap = new Map<string, ModuleCardStatus>()
  let completedModules = 0
  let inProgressModules = 0

  for (const row of progressRows ?? []) {
    const status = row.status
    progressMap.set(row.module_id, status)
    if (status === "completed") completedModules += 1
    if (status === "in_progress") inProgressModules += 1
  }

  const groups = buildModuleGroups({
    classes: normalizedClasses,
    progressMap,
    basePath,
  })

  const totalModules = moduleIds.length
  const percent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0

  return { groups, totalModules, completedModules, inProgressModules, percent }
}
