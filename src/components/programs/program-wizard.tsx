"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import Plus from "lucide-react/dist/esm/icons/plus"

import {
  createProgramAction,
  updateProgramAction,
} from "@/actions/programs"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/lib/toast"

import { DRAFT_STORAGE_KEY, STEPS } from "./program-wizard/constants"
import {
  computeFeasibility,
  hydrateFromProgram,
  normalizeAddons,
  parseErrors,
  requiredFieldsForStep,
  serializePayload,
  stepForField,
  summaryText,
} from "./program-wizard/helpers"
import {
  defaultProgramWizardForm,
  ProgramWizardFormState,
} from "./program-wizard/schema"
import type {
  ProgramWizardFieldErrors,
  ProgramWizardProps,
} from "./program-wizard/types"
import {
  ProgramWizardFooter,
  ProgramWizardHeader,
  ProgramWizardStepContent,
} from "./program-wizard/components"

export type { ProgramWizardProps } from "./program-wizard/types"

export function ProgramWizard({
  mode = "create",
  program,
  open,
  onOpenChange,
  triggerLabel,
}: ProgramWizardProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof open === "boolean"
  const isOpen = isControlled ? (open as boolean) : internalOpen
  const [currentStep, setCurrentStep] = useState(0)
  const [form, setForm] = useState<ProgramWizardFormState>(defaultProgramWizardForm)
  const [errors, setErrors] = useState<ProgramWizardFieldErrors>({})
  const [isPending, startTransition] = useTransition()
  const [isAutoSaving, setIsAutoSaving] = useState(false)

  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hydratedRef = useRef(false)

  const setOpen = useCallback(
    (value: boolean) => {
      if (isControlled) onOpenChange?.(value)
      else setInternalOpen(value)
    },
    [isControlled, onOpenChange],
  )

  const feasibility = useMemo(() => computeFeasibility(form), [form])
  const completion = Math.round(((currentStep + 1) / STEPS.length) * 100)

  useEffect(() => {
    if (!isOpen) {
      hydratedRef.current = false
      setCurrentStep(0)
      setErrors({})
      return
    }

    if (mode === "edit" && program?.id) {
      setForm(hydrateFromProgram(program))
      hydratedRef.current = true
      return
    }

    if (mode === "create") {
      const fallback = { ...defaultProgramWizardForm }
      try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
        if (!raw) {
          setForm(fallback)
          hydratedRef.current = true
          return
        }
        const parsed = JSON.parse(raw) as Partial<ProgramWizardFormState>
        const next = {
          ...fallback,
          ...parsed,
          formatAddons: normalizeAddons(
            parsed.coreFormat ?? fallback.coreFormat,
            Array.isArray(parsed.formatAddons)
              ? parsed.formatAddons.map(String)
              : fallback.formatAddons,
          ),
          staffRoles: Array.isArray(parsed.staffRoles)
            ? parsed.staffRoles
                .map((entry) => ({
                  role:
                    entry && typeof entry.role === "string" ? entry.role : "",
                  hoursPerWeek:
                    entry &&
                    typeof entry.hoursPerWeek === "number" &&
                    Number.isFinite(entry.hoursPerWeek)
                      ? entry.hoursPerWeek
                      : entry &&
                          typeof entry.hoursPerWeek === "string"
                        ? (() => {
                            const parsedHours = Number(entry.hoursPerWeek)
                            return Number.isFinite(parsedHours) ? parsedHours : 0
                          })()
                        : 0,
                }))
            : fallback.staffRoles,
        }
        setForm(next)
      } catch {
        setForm(fallback)
      }
      hydratedRef.current = true
    }
  }, [isOpen, mode, program])

  useEffect(() => {
    if (!isOpen || mode !== "create" || !hydratedRef.current) return
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form))
  }, [form, isOpen, mode])

  useEffect(() => {
    if (!isOpen || mode !== "edit" || !program?.id || !hydratedRef.current) return
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)

    autosaveTimerRef.current = setTimeout(async () => {
      setIsAutoSaving(true)
      const response = await updateProgramAction(program.id, serializePayload(form))
      if ("error" in response) {
        toast.error(response.error)
      }
      setIsAutoSaving(false)
    }, 700)

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [form, isOpen, mode, program?.id])

  const update = (patch: Partial<ProgramWizardFormState>) => {
    setForm((current) => {
      const next = {
        ...current,
        ...patch,
      }
      if (patch.coreFormat) {
        next.formatAddons = normalizeAddons(patch.coreFormat, next.formatAddons)
      }
      return next
    })

    setErrors((current) => {
      const next = { ...current }
      Object.keys(patch).forEach((key) => {
        delete next[key]
      })
      return next
    })
  }

  const validateCurrentStep = () => {
    const allErrors = parseErrors(form)
    const fields = requiredFieldsForStep(currentStep)
    const stepErrors = fields.filter((field) => Boolean(allErrors[field]))
    if (stepErrors.length === 0) return true
    setErrors((current) => ({ ...current, ...allErrors }))
    toast.error("Complete required fields before continuing")
    return false
  }

  const goNext = () => {
    if (!validateCurrentStep()) return
    setCurrentStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  const goPrevious = () => {
    setCurrentStep((current) => Math.max(current - 1, 0))
  }

  const submit = () => {
    const allErrors = parseErrors(form)
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      const firstField = Object.keys(allErrors)[0]
      setCurrentStep(stepForField(firstField))
      toast.error("Fix the highlighted fields")
      return
    }

    startTransition(async () => {
      const payload = serializePayload(form)
      const response =
        mode === "edit" && program?.id
          ? await updateProgramAction(program.id, payload)
          : await createProgramAction(payload)

      if ("error" in response) {
        toast.error(response.error)
        return
      }

      if (mode === "create") {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY)
      }

      toast.success(mode === "create" ? "Program created" : "Program updated")
      setOpen(false)
      setForm(defaultProgramWizardForm)
      setCurrentStep(0)
      setErrors({})
    })
  }

  const copyBrief = async () => {
    try {
      await navigator.clipboard.writeText(summaryText(form))
      toast.success("Program brief copied")
    } catch {
      toast.error("Could not copy program brief")
    }
  }

  const resolvedTrigger =
    triggerLabel ?? (
      <span className="inline-flex items-center gap-2">
        <Plus className="h-4 w-4" aria-hidden />
        New program
      </span>
    )

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {mode === "create" && !isControlled ? (
        <DialogTrigger asChild>
          <Button size="sm" className="h-8 gap-2 px-3">
            {resolvedTrigger}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent
        showCloseButton={false}
        className="left-0 right-0 top-auto bottom-0 z-50 flex h-[94svh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-t-3xl border border-border/60 bg-background p-0 shadow-2xl sm:left-1/2 sm:top-1/2 sm:right-auto sm:bottom-auto sm:h-[90svh] sm:w-[min(96vw,72rem)] sm:max-w-[72rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
      >
        <DialogTitle className="sr-only">Program Builder</DialogTitle>

        <ProgramWizardHeader
          mode={mode}
          currentStep={currentStep}
          completion={completion}
          isAutoSaving={isAutoSaving}
          onStepSelect={setCurrentStep}
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <ProgramWizardStepContent
            mode={mode}
            currentStep={currentStep}
            form={form}
            errors={errors}
            update={update}
            feasibility={feasibility}
            onCopyBrief={copyBrief}
          />
        </div>

        <ProgramWizardFooter
          currentStep={currentStep}
          totalSteps={STEPS.length}
          mode={mode}
          isPending={isPending}
          onCancel={() => setOpen(false)}
          onBack={goPrevious}
          onContinue={goNext}
          onSubmit={submit}
        />
      </DialogContent>
    </Dialog>
  )
}
