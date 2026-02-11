import { notFound, redirect } from "next/navigation"

import { ModuleDetail as TrainingModuleDetail } from "@/components/training/module-detail"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getClassModulesForUser } from "@/lib/modules"
import { buildModuleStates } from "@/lib/module-progress"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import { fetchLearningEntitlements } from "@/lib/accelerator/entitlements"
import { isElectiveAddOnModule } from "@/lib/accelerator/elective-modules"
import { resolveRoadmapSections, type RoadmapSectionStatus } from "@/lib/roadmap"

type ModuleParams = {
  slug: string
  index: string
}

export default async function ModulePage({
  params,
}: {
  params: Promise<ModuleParams>
}) {
  const { slug, index } = await params
  const moduleIndex = Number.parseInt(index, 10)
  if (!Number.isFinite(moduleIndex) || moduleIndex <= 0) {
    notFound()
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw supabaseErrorToError(userError, "Unable to load user.")
  }

  if (!user) {
    redirect(`/login?redirect=/class/${slug}/module/${index}`)
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>()
  const isAdmin = (profile?.role ?? "").toLowerCase() === "admin"

  const { orgId } = await resolveActiveOrganization(supabase, user.id)

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", orgId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()
  const roadmapStatusBySectionId = resolveRoadmapSections(orgRow?.profile ?? {}).reduce(
    (acc, section) => {
      acc[section.id] = (section.status ?? "not_started") as RoadmapSectionStatus
      return acc
    },
    {} as Record<string, RoadmapSectionStatus>,
  )

  const entitlements = await fetchLearningEntitlements({
    supabase,
    userId: user.id,
    orgUserId: orgId,
    isAdmin,
  })

  const classContext = await getClassModulesForUser({
    classSlug: slug,
    userId: user.id,
    forceAdmin: isAdmin,
    supabase,
  })

  if (classContext.modules.length === 0) {
    notFound()
  }

  const moduleStates = buildModuleStates(classContext.modules, classContext.progressMap)
  const currentState = moduleStates.find((state) => state.module.idx === moduleIndex)
  const fallbackState = moduleStates[moduleIndex - 1] ?? null
  const resolvedState = currentState ?? fallbackState
  if (!resolvedState) {
    notFound()
  }
  const currentStateIndex = moduleStates.findIndex((state) => state.module.id === resolvedState.module.id)
  const nextState = currentStateIndex >= 0 ? moduleStates[currentStateIndex + 1] ?? null : null
  const nextLocked = !isAdmin && nextState ? !nextState.module.published : false

  const isFormationClass = slug === "electives"
  if (!entitlements.hasAcceleratorAccess && !isAdmin && !isFormationClass) {
    redirect("/my-organization?paywall=accelerator&plan=accelerator&source=module")
  }

  if (!isAdmin && isFormationClass) {
    const moduleSlug = resolvedState.module.slug.trim().toLowerCase()
    const requiresElectivePurchase = isElectiveAddOnModule({
      slug: moduleSlug,
      title: resolvedState.module.title,
    })
    const hasElectiveAccess =
      entitlements.hasAcceleratorAccess ||
      entitlements.ownedElectiveModuleSlugs.includes(moduleSlug)
    if (requiresElectivePurchase && !hasElectiveAccess) {
      redirect(
        `/my-organization?paywall=elective&plan=electives&module=${encodeURIComponent(moduleSlug)}&source=module`,
      )
    }
  }

  const classDef = {
    id: classContext.classId,
    title: classContext.classTitle,
    blurb: classContext.classDescription ?? "",
    description: classContext.classDescription ?? "",
    slug,
    modules: classContext.modules.map((module) => ({
      id: module.id,
      title: module.title,
      subtitle: module.description ?? undefined,
      videoUrl: module.videoUrl ?? null,
      resources: module.resources,
      assignment: module.assignment,
      assignmentSubmission: module.assignmentSubmission,
      hasDeck: module.hasDeck,
    })),
  }

  const contentMd = (resolvedState.module as { contentMd?: string | null }).contentMd ?? null
  const moduleTitle = resolvedState.module.title
  const moduleSubtitle = resolvedState.module.description ?? undefined

  const moduleDef = {
    id: resolvedState.module.id,
    title: moduleTitle,
    subtitle: moduleSubtitle,
    videoUrl: resolvedState.module.videoUrl ?? null,
    contentMd,
    resources: resolvedState.module.resources,
    assignment: resolvedState.module.assignment,
    assignmentSubmission: resolvedState.module.assignmentSubmission,
    locked: resolvedState.locked,
    hasDeck: resolvedState.module.hasDeck,
  }
  const completedModuleIds = moduleStates.filter((state) => state.completed).map((state) => state.module.id)

  return (
    <div className="w-full">
      <TrainingModuleDetail
        c={classDef}
        m={moduleDef}
        isAdmin={isAdmin}
        nextLocked={nextLocked}
        roadmapStatusBySectionId={roadmapStatusBySectionId}
        completedModuleIds={completedModuleIds}
      />
    </div>
  )
}
