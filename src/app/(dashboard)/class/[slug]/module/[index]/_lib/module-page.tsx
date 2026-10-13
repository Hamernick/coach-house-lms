import { notFound, redirect } from "next/navigation"

import { ModuleDetail as TrainingModuleDetail } from "@/components/training/module-detail"
import { fetchLearningEntitlements } from "@/lib/accelerator/entitlements"
import { isElectiveAddOnModule } from "@/lib/accelerator/elective-modules"
import { buildModuleStates } from "@/lib/module-progress"
import { getClassModulesForUser } from "@/lib/modules"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import { resolveRoadmapSections, type RoadmapSectionStatus } from "@/lib/roadmap"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type ModuleParams = {
  slug: string
  index: string
}

type ModuleSearchParams = {
  from?: string | string[]
}

export async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<ModuleParams>
  searchParams?: Promise<ModuleSearchParams>
}) {
  const { slug, index } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
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
  if (!currentState) {
    notFound()
  }
  const currentStateIndex = moduleStates.findIndex((state) => state.module.id === currentState.module.id)
  const nextState = currentStateIndex >= 0 ? moduleStates[currentStateIndex + 1] ?? null : null
  const nextLocked = !isAdmin && nextState ? !nextState.module.published : false

  const isFormationClass = slug === "electives"
  if (!entitlements.hasAcceleratorAccess && !isAdmin && !isFormationClass) {
    redirect("/organization?paywall=organization&plan=organization&source=module")
  }

  if (!isAdmin && isFormationClass) {
    const moduleSlug = currentState.module.slug.trim().toLowerCase()
    const requiresElectivePurchase = isElectiveAddOnModule({
      slug: moduleSlug,
      title: currentState.module.title,
    })
    const hasElectiveAccess =
      entitlements.hasAcceleratorAccess ||
      entitlements.ownedElectiveModuleSlugs.includes(moduleSlug)
    if (requiresElectivePurchase && !hasElectiveAccess) {
      redirect(
        `/organization?paywall=organization&plan=organization&module=${encodeURIComponent(moduleSlug)}&source=module`,
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
      idx: module.idx,
      title: module.title,
      subtitle: module.description ?? undefined,
      videoUrl: module.videoUrl ?? null,
      resources: module.resources,
      assignment: module.assignment,
      assignmentSubmission: module.assignmentSubmission,
      hasDeck: module.hasDeck,
    })),
  }

  const contentMd = (currentState.module as { contentMd?: string | null }).contentMd ?? null
  const moduleTitle = currentState.module.title
  const moduleSubtitle = currentState.module.description ?? undefined

  const moduleDef = {
    id: currentState.module.id,
    title: moduleTitle,
    subtitle: moduleSubtitle,
    videoUrl: currentState.module.videoUrl ?? null,
    contentMd,
    resources: currentState.module.resources,
    assignment: currentState.module.assignment,
    assignmentSubmission: currentState.module.assignmentSubmission,
    locked: currentState.locked,
    hasDeck: currentState.module.hasDeck,
  }
  const completedModuleIds = moduleStates.filter((state) => state.completed).map((state) => state.module.id)
  const fromParam = Array.isArray(resolvedSearchParams.from)
    ? resolvedSearchParams.from[0]
    : resolvedSearchParams.from
  const returnHref = fromParam === "documents" ? "/organization/documents" : null

  return (
    <div className="flex min-h-full w-full flex-col">
      <TrainingModuleDetail
        c={classDef}
        m={moduleDef}
        isAdmin={isAdmin}
        nextLocked={nextLocked}
        roadmapStatusBySectionId={roadmapStatusBySectionId}
        completedModuleIds={completedModuleIds}
        returnHref={returnHref}
      />
    </div>
  )
}
