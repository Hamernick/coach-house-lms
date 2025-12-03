"use client"

import { useCallback, useMemo, useRef, useState, useTransition } from "react"
import { toast } from "@/lib/toast"

import { createProgramAction, updateProgramAction } from "@/app/(dashboard)/my-organization/programs/actions"
import {
  DialogStack,
  DialogStackBody,
  DialogStackOverlay,
  DialogStackTrigger,
} from "@/components/kibo-ui/dialog-stack"

import {
  defaultProgramWizardForm,
  ProgramWizardFormState,
  ProgramWizardSchema,
} from "./program-wizard/schema"
import { BasicsStep } from "./program-wizard/steps/basics-step"
import { ScheduleStep } from "./program-wizard/steps/schedule-step"
import { FundingStep } from "./program-wizard/steps/funding-step"

type ProgramRecord = {
  id: string
  title: string | null
  subtitle?: string | null
  location?: string | null
  address_street?: string | null
  address_city?: string | null
  address_state?: string | null
  address_postal?: string | null
  address_country?: string | null
  image_url?: string | null
  start_date?: string | null
  end_date?: string | null
  status_label?: string | null
  cta_label?: string | null
  cta_url?: string | null
  goal_cents?: number | null
  raised_cents?: number | null
  features?: string[] | null
  is_public?: boolean | null
}

export type ProgramWizardProps = {
  mode?: "create" | "edit"
  program?: (Partial<ProgramRecord> & { id: string }) | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  triggerLabel?: string
}

export function ProgramWizard({
  mode = "create",
  program,
  open,
  onOpenChange,
  triggerLabel = "New program",
}: ProgramWizardProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof open === "boolean"
  const isOpen = isControlled ? (open as boolean) : internalOpen
  const setOpen = useCallback(
    (value: boolean) => {
      if (isControlled) onOpenChange?.(value)
      else setInternalOpen(value)
    },
    [isControlled, onOpenChange],
  )

  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<ProgramWizardFormState>(defaultProgramWizardForm)

  const saveTimer = useRef<NodeJS.Timeout | null>(null)
  const scheduleSave = useCallback(
    (next: ProgramWizardFormState) => {
      if (mode !== "edit" || !program?.id) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        await updateProgramAction(program.id, serializePayload(next))
      }, 600)
    },
    [mode, program?.id],
  )

  const hydrateFromProgram = useCallback((p: ProgramWizardProps["program"]) => {
    if (!p) return
    setForm((prev) => ({
      ...prev,
      title: p.title || "",
      subtitle: p.subtitle || "",
      location: p.location || "",
      imageUrl: p.image_url || "",
      startDate: p.start_date || "",
      endDate: p.end_date || "",
      addressStreet: p.address_street || "",
      addressCity: p.address_city || "",
      addressState: p.address_state || "",
      addressPostal: p.address_postal || "",
      addressCountry: p.address_country || "",
      statusLabel: p.status_label || "In progress",
      ctaLabel: p.cta_label || "Learn more",
      ctaUrl: p.cta_url || "",
      goalUsd: p.goal_cents ? Math.round(Number(p.goal_cents) / 100) : 0,
      raisedUsd: p.raised_cents ? Math.round(Number(p.raised_cents) / 100) : 0,
      features: Array.isArray(p.features) ? p.features : [],
      isPublic: Boolean(p.is_public),
    }))
  }, [])

  const prevProgramId = useRef<string | null>(null)
  if (mode === "edit" && program?.id && prevProgramId.current !== program.id) {
    prevProgramId.current = program.id
    hydrateFromProgram(program)
  }

  const submit = () => {
    startTransition(async () => {
      const parsed = ProgramWizardSchema.safeParse(form)
      if (!parsed.success) {
        toast.error("Fix the highlighted fields")
        return
      }
      const payload = parsed.data
      const response = await createProgramAction(serializePayload(payload))
      if ("error" in response) {
        toast.error(response.error)
        return
      }
      toast.success("Program created")
      setOpen(false)
      setForm(defaultProgramWizardForm)
    })
  }

  const handleUpload = useCallback(async (file: File | null | undefined) => {
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    const response = await fetch(`/api/account/program-media`, { method: "POST", body: formData })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      toast.error(data?.error || "Upload failed")
      return
    }
    setForm((current) => ({ ...current, imageUrl: data.url as string }))
    toast.success("Image uploaded")
  }, [])

  const editHandlers = useMemo(
    () => ({
      onOpenChange: setOpen,
      onEdit: (next: ProgramWizardFormState) => setForm(next),
      onScheduleSave: scheduleSave,
    }),
    [scheduleSave, setOpen],
  )

  return (
    <DialogStack open={isOpen} onOpenChange={setOpen}>
      {mode === "create" && !isControlled ? (
        <DialogStackTrigger className="h-8 px-3">{triggerLabel}</DialogStackTrigger>
      ) : null}
      <DialogStackOverlay />
      <DialogStackBody>
        <BasicsStep
          form={form}
          onUpload={handleUpload}
          {...editHandlers}
        />
        <ScheduleStep
          form={form}
          {...editHandlers}
        />
        <FundingStep
          form={form}
          mode={mode}
          isPending={isPending}
          onSubmit={submit}
          {...editHandlers}
        />
      </DialogStackBody>
    </DialogStack>
  )
}

function serializePayload(form: ProgramWizardFormState) {
  return {
    title: form.title,
    subtitle: form.subtitle,
    location: form.location,
    imageUrl: form.imageUrl,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    addressStreet: form.addressStreet || null,
    addressCity: form.addressCity || null,
    addressState: form.addressState || null,
    addressPostal: form.addressPostal || null,
    addressCountry: form.addressCountry || null,
    features: (form.features || []) as string[],
    statusLabel: form.statusLabel,
    ctaLabel: form.ctaLabel || null,
    ctaUrl: form.ctaUrl || null,
    goalCents: Math.round(((form.goalUsd ?? 0) as number) * 100),
    raisedCents: Math.round(((form.raisedUsd ?? 0) as number) * 100),
    isPublic: form.isPublic ?? false,
  }
}
