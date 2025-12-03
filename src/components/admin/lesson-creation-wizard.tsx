"use client"

import { useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Stepper } from "@/components/admin/lesson-wizard/Stepper"
import { WizardFooter } from "@/components/admin/lesson-wizard/WizardFooter"
import { LandingStep } from "@/components/admin/lesson-wizard/steps/LandingStep"
import { ModulesOverviewStep } from "@/components/admin/lesson-wizard/steps/ModulesOverviewStep"
import { ModuleStep } from "@/components/admin/lesson-wizard/steps/ModuleStep"
import { FORM_FIELD_TYPE_OPTIONS, DEFAULT_SLIDER_RANGE } from "@/lib/lessons/constants"
import { LESSON_SUBTITLE_MAX_LENGTH, LESSON_TITLE_MAX_LENGTH, clampText } from "@/lib/lessons/limits"
import { useLessonWizard } from "@/hooks/lessons/use-lesson-wizard"
import type { LessonWizardPayload } from "@/lib/lessons/types"
import { Skeleton } from "@/components/ui/skeleton"

interface LessonCreationWizardProps {
  open: boolean
  mode?: "create" | "edit"
  classId?: string
  initialPayload?: LessonWizardPayload | null
  focusModuleId?: string | null
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (formData: FormData) => Promise<{ id?: string; error?: string }>
  onCreateModule?: () => void | Promise<void>
}

export function LessonCreationWizard({
  open,
  mode = "create",
  classId,
  initialPayload = null,
  focusModuleId = null,
  onOpenChange,
  onSubmit,
  loading = false,
  onCreateModule,
}: LessonCreationWizardProps) {
  const {
    step,
    totalSteps,
    isEditMode,
    error,
    setError,
    title,
    subtitle,
    body,
    videoUrl,
    links,
    modules,
    currentModuleIndex,
    setTitle,
    setSubtitle,
    setBody,
    setVideoUrl,
    addLink,
    updateLink,
    removeLink,
    addModule,
    removeModule,
    updateModule,
    addResource,
    updateResource,
    removeResource,
    addFormField,
    updateFormField,
    removeFormField,
    handleBack,
    handleNext,
    buildFinalPayload,
    isDirty,
    resetWizard,
  } = useLessonWizard({ open, mode, initialPayload, focusModuleId })

  const [pending, startTransition] = useTransition()
  const overviewAddHandler = isEditMode
    ? onCreateModule
      ? () => {
          void onCreateModule()
        }
      : undefined
    : addModule
  const moduleAddDisabled = isEditMode ? loading || pending : false

  const handleFinish = () => {
    const { payload, error: buildError } = buildFinalPayload()
    if (buildError || !payload) {
      setError(buildError ?? "Invalid payload")
      return
    }

    const fd = new FormData()
    fd.set("payload", JSON.stringify(payload))
    if (isEditMode && classId) fd.set("classId", classId)

    startTransition(async () => {
      try {
        const result = await onSubmit(fd)
        if (result?.error) {
          setError(result.error)
          return
        }
        resetWizard()
        onOpenChange(false)
        const nextId = result?.id ?? classId
        if (mode === "create") {
          if (nextId) window.location.href = `/admin/classes/${nextId}`
        } else {
          window.location.reload()
        }
      } catch (err) {
        console.error(err)
        setError(isEditMode ? "Failed to update lesson. Please try again." : "Failed to create lesson. Please try again.")
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) {
          if (!next) {
            resetWizard()
          }
          onOpenChange(next)
        }
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-4xl sm:max-w-5xl overflow-hidden">
        <DialogHeader className="border-b border-border py-5 min-h-14">
          <div className="relative flex h-full items-center justify-center">
            <DialogTitle className="text-2xl absolute left-0">{isEditMode ? "Edit Lesson" : "Create New Lesson"}</DialogTitle>
            <Stepper step={step} totalSteps={totalSteps} />
          </div>
        </DialogHeader>

        <div className="h-[65vh] overflow-y-auto px-3 sm:-mx-1 sm:px-1">

          <div className="py-2">
            {loading ? (
              <div className="space-y-4 p-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-24 w-full" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ) : (
              <>
                {step === 1 ? (
                  <LandingStep
                    title={title}
                    subtitle={subtitle}
                    body={body}
                    videoUrl={videoUrl}
                    links={links}
                    onTitleChange={(v) => setTitle(clampText(v, LESSON_TITLE_MAX_LENGTH))}
                    onSubtitleChange={(v) => setSubtitle(clampText(v, LESSON_SUBTITLE_MAX_LENGTH))}
                    onBodyChange={setBody}
                    onVideoUrlChange={setVideoUrl}
                    onAddLink={addLink}
                    onUpdateLink={updateLink}
                    onRemoveLink={removeLink}
                  />
                ) : null}
                {step === 2 ? (
                  <ModulesOverviewStep
                    modules={modules}
                    isEditMode={isEditMode}
                    onAdd={overviewAddHandler}
                    onRemove={removeModule}
                    addDisabled={moduleAddDisabled}
                  />
                ) : null}
                {step >= 3 ? (
                  <ModuleStep
                    index={currentModuleIndex}
                    module={modules[currentModuleIndex]}
                    formFieldTypeOptions={FORM_FIELD_TYPE_OPTIONS}
                    defaultSliderRange={DEFAULT_SLIDER_RANGE}
                    onChangeTitle={(v) => updateModule(currentModuleIndex, "title", v)}
                    onChangeSubtitle={(v) => updateModule(currentModuleIndex, "subtitle", v)}
                    onChangeBody={(v) => updateModule(currentModuleIndex, "body", v)}
                    onAddResource={() => addResource(currentModuleIndex)}
                    onUpdateResource={(id, field, value) => updateResource(currentModuleIndex, id, field, value)}
                    onRemoveResource={(id) => removeResource(currentModuleIndex, id)}
                    onAddField={() => addFormField(currentModuleIndex)}
                    onUpdateField={(fieldId, updater) => updateFormField(currentModuleIndex, fieldId, updater)}
                    onRemoveField={(fieldId) => removeFormField(currentModuleIndex, fieldId)}
                  />
                ) : null}
              </>
            )}
          </div>

          {error ? <p className="pb-2 text-sm text-rose-500">{error}</p> : null}
        </div>

        <Separator />
        <WizardFooter
          pending={pending}
          isEditMode={isEditMode}
          isDirty={isDirty}
          step={step}
          totalSteps={totalSteps}
          onCancel={() => onOpenChange(false)}
          {...(loading
            ? { onBack: () => {}, onNext: () => {}, onFinish: () => {} }
            : { onBack: handleBack, onNext: handleNext, onFinish: handleFinish })}
        />
      </DialogContent>
    </Dialog>
  )
}
