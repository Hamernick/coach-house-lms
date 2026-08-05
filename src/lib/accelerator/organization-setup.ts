import type { SupabaseClient } from "@supabase/supabase-js"

import type {
  AcceleratorProgressSummary,
  ModuleCard,
} from "@/lib/accelerator/progress"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import type { Database } from "@/lib/supabase/types"

export const ORGANIZATION_SETUP_MODULE_SLUG = "organization-setup"

export const ORGANIZATION_SETUP_MODULE_SLUGS = [
  ORGANIZATION_SETUP_MODULE_SLUG,
  "workspace-setup",
  "workspace-onboarding-organization-setup",
] as const

const ORGANIZATION_SETUP_MODULE_SLUG_SET = new Set<string>(
  ORGANIZATION_SETUP_MODULE_SLUGS
)

function isOrganizationSetupModule(module: Pick<ModuleCard, "slug" | "title">) {
  const slug = module.slug.trim().toLowerCase()
  const title = module.title.trim().toLowerCase()
  return (
    ORGANIZATION_SETUP_MODULE_SLUG_SET.has(slug) ||
    title === "organization setup"
  )
}

export function hasSavedOrganizationSetup({
  organizationName,
  publicSlug,
}: {
  organizationName: string | null | undefined
  publicSlug: string | null | undefined
}) {
  return Boolean(organizationName?.trim() && publicSlug?.trim())
}

function buildProgressTotals(groups: AcceleratorProgressSummary["groups"]) {
  const modules = groups.flatMap((group) => group.modules)
  const completedModules = modules.filter(
    (module) => module.status === "completed"
  ).length
  const inProgressModules = modules.filter(
    (module) => module.status === "in_progress"
  ).length

  return {
    totalModules: modules.length,
    completedModules,
    inProgressModules,
    percent:
      modules.length > 0
        ? Math.round((completedModules / modules.length) * 100)
        : 0,
  }
}

export function applyOrganizationSetupAcceleratorProgressOverride(
  summary: AcceleratorProgressSummary,
  organizationSetupComplete: boolean
): AcceleratorProgressSummary {
  if (!organizationSetupComplete) return summary

  let changed = false
  const groups = summary.groups.map((group) => ({
    ...group,
    modules: group.modules.map((module) => {
      if (module.status === "completed" || !isOrganizationSetupModule(module)) {
        return module
      }
      changed = true
      return { ...module, status: "completed" as const }
    }),
  }))

  if (!changed) return summary
  return { ...summary, groups, ...buildProgressTotals(groups) }
}

export async function markOrganizationSetupModuleCompleted({
  supabase,
  userId,
}: {
  supabase: SupabaseClient<Database, "public">
  userId: string
}) {
  const { data: setupModules, error: moduleError } = await supabase
    .from("modules")
    .select("id, slug")
    .in("slug", [...ORGANIZATION_SETUP_MODULE_SLUGS])
    .eq("is_published", true)
    .returns<Array<{ id: string; slug: string }>>()

  if (moduleError) {
    throw supabaseErrorToError(
      moduleError,
      "Unable to load organization setup progress."
    )
  }
  const setupModule = ORGANIZATION_SETUP_MODULE_SLUGS.map((slug) =>
    setupModules?.find((module) => module.slug === slug)
  ).find((module): module is { id: string; slug: string } => Boolean(module))
  if (!setupModule) {
    throw new Error("Organization setup progress is unavailable.")
  }

  const { data: existingProgress, error: existingProgressError } =
    await supabase
      .from("module_progress")
      .select("status, completed_at")
      .eq("user_id", userId)
      .eq("module_id", setupModule.id)
      .maybeSingle<{ status: string; completed_at: string | null }>()

  if (existingProgressError) {
    throw supabaseErrorToError(
      existingProgressError,
      "Unable to load organization setup progress."
    )
  }
  if (existingProgress?.status === "completed") {
    return {
      changed: false,
      completedAt: existingProgress.completed_at,
      moduleId: setupModule.id,
    }
  }

  const completedAt = new Date().toISOString()
  const { error: progressError } = await supabase
    .from("module_progress")
    .upsert(
      {
        user_id: userId,
        module_id: setupModule.id,
        status: "completed",
        completed_at: completedAt,
        updated_at: completedAt,
      },
      { onConflict: "user_id,module_id" }
    )

  if (progressError) {
    throw supabaseErrorToError(
      progressError,
      "Unable to complete organization setup."
    )
  }

  return { changed: true, completedAt, moduleId: setupModule.id }
}
