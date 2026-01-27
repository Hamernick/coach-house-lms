"use client"

import { useEffect, useMemo } from "react"
import { usePathname } from "next/navigation"
import Lock from "lucide-react/dist/esm/icons/lock"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RightRailSlot } from "@/components/app-shell/right-rail"

import { ModuleHeader } from "./module-detail/module-header"
import { ModuleStepper } from "./module-detail/module-stepper"
import { ModuleRightRail } from "./module-right-rail"
import type { ClassDef, Module } from "./types"
import { getInlineVideoUrl, getVideoEmbedUrl } from "./module-detail/utils"
import { useAssignmentSubmission } from "./module-detail/use-assignment-submission"
import type { RoadmapSectionStatus } from "@/lib/roadmap"

export function ModuleDetail({
  c,
  m,
  isAdmin = false,
  nextLocked = false,
  roadmapStatusBySectionId,
  completedModuleIds = [],
}: {
  c: ClassDef
  m: Module
  isAdmin?: boolean
  nextLocked?: boolean
  roadmapStatusBySectionId?: Record<string, RoadmapSectionStatus>
  completedModuleIds?: string[]
}) {
  const assignmentFields = useMemo(() => m.assignment?.fields ?? [], [m.assignment?.fields])
  const completeOnSubmit = Boolean(m.assignment?.completeOnSubmit)
  const lockedForLearners = Boolean(m.locked)

  const {
    formSeed,
    handleSubmit,
    isSubmitting,
    lastSavedAt,
    message,
    statusMeta,
    submissionError,
  } = useAssignmentSubmission({
    assignmentFields,
    moduleId: m.id,
    submission: m.assignmentSubmission ?? null,
  })

  const pathname = usePathname()
  const basePath = pathname?.startsWith("/accelerator") ? "/accelerator" : ""
  const breakHref = basePath ? "/accelerator" : "/my-organization"

  const embedUrl = getVideoEmbedUrl(m.videoUrl)
  const inlineVideoUrl = getInlineVideoUrl(m.videoUrl)
  const lessonNotesContent = m.contentMd ?? null
  const resources = Array.isArray(m.resources) ? m.resources : []
  const currentModuleIndex = useMemo(
    () => c.modules.findIndex((module) => module.id === m.id),
    [c.modules, m.id],
  )
  const nextModule = currentModuleIndex >= 0 ? c.modules[currentModuleIndex + 1] : null
  const nextHref = nextModule && c.slug ? `${basePath}/class/${c.slug}/module/${currentModuleIndex + 2}` : null
  useEffect(() => {
    if (typeof window === "undefined") return
    completedModuleIds.forEach((id) => {
      try {
        window.sessionStorage.setItem(`module-complete-${id}`, "true")
      } catch {
        /* ignore */
      }
    })
  }, [completedModuleIds])

  return (
    <div className="space-y-5">
      <RightRailSlot priority={5} align="bottom">
      <ModuleRightRail
        moduleId={m.id}
        resources={resources}
        breakHref={breakHref}
        hasDeck={Boolean(m.hasDeck)}
      />
    </RightRailSlot>
      <ModuleHeader title={m.title} subtitle={undefined} titlePlacement="header" showMobileBody={false} />

      {isAdmin && lockedForLearners ? (
        <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-100">
          <Lock className="h-4 w-4" />
          <AlertTitle>Locked for learners</AlertTitle>
          <AlertDescription>
            Learners will unlock this module after they complete the prior lessons. You can
            still preview all content.
          </AlertDescription>
        </Alert>
      ) : null}

      <ModuleStepper
        moduleId={m.id}
        moduleTitle={m.title}
        moduleSubtitle={m.subtitle ?? null}
        classTitle={c.title}
        stepperPlacement="header"
        showModuleHeading={false}
        embedUrl={embedUrl}
        videoUrl={inlineVideoUrl}
        fallbackUrl={m.videoUrl ?? null}
        hasDeck={Boolean(m.hasDeck)}
        lessonNotesContent={lessonNotesContent}
        resources={resources}
        assignmentFields={assignmentFields}
        initialValues={formSeed}
        roadmapStatusBySectionId={roadmapStatusBySectionId}
        pending={isSubmitting}
        onSubmit={handleSubmit}
        statusLabel={statusMeta?.label ?? null}
        statusVariant={statusMeta?.variant ?? "outline"}
        statusNote={statusMeta?.note ?? null}
        helperText={message}
        errorMessage={submissionError}
        updatedAt={lastSavedAt}
        completeOnSubmit={completeOnSubmit}
        nextHref={nextHref}
        nextLocked={nextLocked}
        breakHref={breakHref}
        moduleIndex={currentModuleIndex >= 0 ? currentModuleIndex : null}
        moduleCount={c.modules.length}
      />

    </div>
  )
}
