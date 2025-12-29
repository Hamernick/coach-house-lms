import { notFound, redirect } from "next/navigation"

import { ModuleDetail as TrainingModuleDetail } from "@/components/training/module-detail"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getClassModulesForUser } from "@/lib/modules"
import { buildModuleStates } from "@/lib/module-progress"

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

  if (userError) {
    throw userError
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

  return (
    <div className="px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <TrainingModuleDetail c={classDef} m={moduleDef} isAdmin={isAdmin} />
      </div>
    </div>
  )
}
