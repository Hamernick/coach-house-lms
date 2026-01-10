"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import Lock from "lucide-react/dist/esm/icons/lock"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { createClassWizardAction, updateClassWizardAction } from "@/app/(admin)/admin/classes/actions"
import { ModuleHeader } from "./module-detail/module-header"
import { ModuleStepper } from "./module-detail/module-stepper"
import type { ClassDef, Module } from "./types"
import { getInlineVideoUrl, getVideoEmbedUrl } from "./module-detail/utils"
import { useLessonWizard } from "./module-detail/use-lesson-wizard"
import { useAssignmentSubmission } from "./module-detail/use-assignment-submission"

const LessonCreationWizardLazy = dynamic(
  () =>
    import("@/components/admin/lesson-creation-wizard").then(
      (mod) => mod.LessonCreationWizard,
    ),
  {
    ssr: false,
    loading: () => (
      <Button disabled variant="secondary" className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading editor…
      </Button>
    ),
  },
)

export function ModuleDetail({
  c,
  m,
  isAdmin = false,
}: {
  c: ClassDef
  m: Module
  isAdmin?: boolean
}) {
  const assignmentFields = useMemo(() => m.assignment?.fields ?? [], [m.assignment?.fields])
  const completeOnSubmit = Boolean(m.assignment?.completeOnSubmit)
  const lockedForLearners = Boolean(m.locked)
  const {
    wizardOpen,
    wizardPayload,
    wizardLoading,
    wizardError,
    wizardFocusModuleId,
    handleCreateModule,
    handleOpenChange,
    loadWizardPayload,
  } = useLessonWizard({ classId: c.id, moduleId: m.id })

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

  return (
    <div className="space-y-6">
      <ModuleHeader
        title={m.title}
        subtitle={m.subtitle}
        isAdmin={isAdmin}
        wizardError={wizardError}
        wizardLoading={wizardLoading}
        onEdit={() => void loadWizardPayload(m.id)}
        titlePlacement="header"
      />

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
        embedUrl={embedUrl}
        videoUrl={inlineVideoUrl}
        fallbackUrl={m.videoUrl ?? null}
        hasDeck={Boolean(m.hasDeck)}
        lessonNotesContent={lessonNotesContent}
        resources={resources}
        assignmentFields={assignmentFields}
        initialValues={formSeed}
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
        moduleIndex={currentModuleIndex >= 0 ? currentModuleIndex : null}
        moduleCount={c.modules.length}
        isAdmin={isAdmin}
      />

      {isAdmin ? (
        <LessonCreationWizardLazy
          open={wizardOpen}
          mode={wizardPayload ? "edit" : "create"}
          classId={c.id}
          initialPayload={wizardPayload}
          focusModuleId={wizardFocusModuleId ?? m.id}
          loading={wizardLoading}
          onCreateModule={handleCreateModule}
          onOpenChange={handleOpenChange}
          onSubmit={async (formData) => {
            const payloadRaw = formData.get("payload")
            const classIdValue = formData.get("classId") ?? c.id
            if (typeof payloadRaw !== "string" || typeof classIdValue !== "string") {
              return { error: "Invalid lesson payload" }
            }
            if (wizardPayload) {
              return updateClassWizardAction(classIdValue, payloadRaw)
            }
            return createClassWizardAction(formData)
          }}
        />
      ) : null}
    </div>
  )
}
