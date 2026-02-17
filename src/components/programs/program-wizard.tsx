"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react"
import Plus from "lucide-react/dist/esm/icons/plus"
import CopyIcon from "lucide-react/dist/esm/icons/copy"

import {
  createProgramAction,
  updateProgramAction,
  type CreateProgramPayload,
} from "@/actions/programs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/lib/toast"

import {
  defaultProgramWizardForm,
  DELIVERY_FORMATS,
  LOCATION_MODES,
  ProgramWizardFormState,
  PROGRAM_TYPES,
  ProgramWizardSchema,
} from "./program-wizard/schema"

type ProgramRecord = {
  id: string
  title: string | null
  subtitle?: string | null
  description?: string | null
  location?: string | null
  location_type?: "in_person" | "online" | null
  location_url?: string | null
  image_url?: string | null
  duration_label?: string | null
  features?: string[] | null
  status_label?: string | null
  goal_cents?: number | null
  raised_cents?: number | null
  is_public?: boolean | null
  start_date?: string | null
  end_date?: string | null
  cta_label?: string | null
  cta_url?: string | null
  wizard_snapshot?: Record<string, unknown> | null
}

export type ProgramWizardProps = {
  mode?: "create" | "edit"
  program?: (Partial<ProgramRecord> & { id: string }) | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  triggerLabel?: ReactNode
}

type StepMeta = {
  title: string
  helper: string
}

const STEPS: StepMeta[] = [
  {
    title: "Program name",
    helper: "Give this program a clear name and one-sentence summary.",
  },
  {
    title: "Type + format",
    helper: "Pick the main way people experience it, then optional add-ons.",
  },
  {
    title: "Audience + outcomes",
    helper: "Describe the participant experience and what changes.",
  },
  {
    title: "Pilot size + staffing",
    helper: "How many people, and who will run it?",
  },
  {
    title: "When + where",
    helper: "Set cadence, start month, and delivery location.",
  },
  {
    title: "Budget + feasibility",
    helper: "Estimate cost and capacity as you type.",
  },
  {
    title: "Review + generate",
    helper: "Generate a concise program brief for your team and funders.",
  },
]

const DRAFT_STORAGE_KEY = "coach-house:program-wizard-draft:v1"

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function toStringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function toNumberValue(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean)
}

function toMonthInput(value: string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

function monthToIsoStart(value: string) {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null
  return `${value}-01T00:00:00.000Z`
}

function normalizeAddons(coreFormat: string, addons: string[]) {
  const unique = new Set<string>()
  addons.forEach((addon) => {
    const trimmed = addon.trim()
    if (!trimmed || trimmed === coreFormat) return
    unique.add(trimmed)
  })
  return Array.from(unique)
}

function estimateDurationWeeks(durationLabel: string) {
  const normalized = durationLabel.toLowerCase()
  const numeric = normalized.match(/\d+(?:\.\d+)?/)
  const value = numeric ? Number(numeric[0]) : Number.NaN
  if (!Number.isFinite(value)) return null
  if (normalized.includes("month")) return value * 4
  if (normalized.includes("week")) return value
  if (normalized.includes("day")) return value / 7
  return value
}

function estimateSessionsPerWeek(frequency: string) {
  const normalized = frequency.trim().toLowerCase()
  if (!normalized) return null
  if (normalized.includes("daily")) return 5
  if (normalized.includes("twice") && normalized.includes("week")) return 2
  if (normalized.includes("weekly")) return 1
  if (normalized.includes("biweekly") || normalized.includes("every other week")) return 0.5
  if (normalized.includes("monthly")) return 0.25
  return 1
}

function computeFeasibility(form: ProgramWizardFormState) {
  const people = Number(form.pilotPeopleServed) > 0 ? Number(form.pilotPeopleServed) : 0
  const staff = Number(form.staffCount) > 0 ? Number(form.staffCount) : 0
  const budget = Number(form.budgetUsd) > 0 ? Number(form.budgetUsd) : 0

  const costPerParticipant = people > 0 ? budget / people : null
  const participantsPerStaff = staff > 0 ? people / staff : null

  const durationWeeks = estimateDurationWeeks(form.durationLabel)
  const sessionsPerWeek = estimateSessionsPerWeek(form.frequency)
  const serviceIntensity =
    durationWeeks !== null && sessionsPerWeek !== null
      ? Math.max(0, Math.round(durationWeeks * sessionsPerWeek))
      : null

  const flags: string[] = []
  if (costPerParticipant !== null && costPerParticipant > 3000) {
    flags.push("Very high cost per participant")
  }
  if (participantsPerStaff !== null && participantsPerStaff > 40) {
    flags.push("Low staffing for this many participants")
  }
  if (!form.startMonth || !form.frequency.trim() || !form.durationLabel.trim()) {
    flags.push("No schedule yet")
  }

  return {
    costPerParticipant,
    participantsPerStaff,
    serviceIntensity,
    flags,
  }
}

function money(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Not enough data"
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value))
}

function ratio(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Not enough data"
  return `${value.toFixed(1)} participants per staff`
}

function hydrateFromProgram(program: ProgramWizardProps["program"]): ProgramWizardFormState {
  if (!program) return defaultProgramWizardForm
  const snapshot = isRecord(program.wizard_snapshot) ? program.wizard_snapshot : {}
  const participants = isRecord(snapshot) ? toStringArray(snapshot.participantReceives) : []
  const outcomes = isRecord(snapshot) ? toStringArray(snapshot.successOutcomes) : []
  const staffRolesRaw = isRecord(snapshot) && Array.isArray(snapshot.staffRoles) ? snapshot.staffRoles : []
  const staffRoles = staffRolesRaw
    .filter((entry) => isRecord(entry))
    .map((entry) => ({
      role: toStringValue(entry.role).trim(),
      hoursPerWeek: toNumberValue(entry.hoursPerWeek, 0),
    }))
    .filter((entry) => entry.role.length > 0)

  const features = Array.isArray(program.features) ? program.features : []
  const snapshotProgramType = toStringValue(snapshot.programType)
  const snapshotCoreFormat = toStringValue(snapshot.coreFormat)

  const programType = (PROGRAM_TYPES as readonly string[]).includes(snapshotProgramType)
    ? (snapshotProgramType as ProgramWizardFormState["programType"])
    : "Direct Services"

  const coreFormatCandidate =
    (DELIVERY_FORMATS as readonly string[]).includes(snapshotCoreFormat)
      ? snapshotCoreFormat
      : features.find((feature) => (DELIVERY_FORMATS as readonly string[]).includes(feature))

  const coreFormat = (coreFormatCandidate as ProgramWizardFormState["coreFormat"]) ?? "Cohort"

  const addonCandidates = toStringArray(snapshot.formatAddons)
  const fallbackAddons = features.filter((feature) => feature !== coreFormat)
  const formatAddons = normalizeAddons(
    coreFormat,
    addonCandidates.length > 0 ? addonCandidates : fallbackAddons,
  )

  const locationModeRaw = toStringValue(snapshot.locationMode)
  const locationMode = (LOCATION_MODES as readonly string[]).includes(locationModeRaw)
    ? (locationModeRaw as ProgramWizardFormState["locationMode"])
    : program.location_type === "online"
      ? "online"
      : "in_person"

  return {
    ...defaultProgramWizardForm,
    title: toStringValue(snapshot.title, toStringValue(program.title)),
    oneSentence: toStringValue(snapshot.oneSentence, toStringValue(program.description)),
    subtitle: toStringValue(snapshot.subtitle, toStringValue(program.subtitle)),
    imageUrl: toStringValue(snapshot.imageUrl, toStringValue(program.image_url)),
    programType,
    coreFormat,
    formatAddons,
    servesWho: toStringValue(snapshot.servesWho),
    eligibilityRules: toStringValue(snapshot.eligibilityRules),
    participantReceive1: toStringValue(snapshot.participantReceive1, participants[0] ?? ""),
    participantReceive2: toStringValue(snapshot.participantReceive2, participants[1] ?? ""),
    participantReceive3: toStringValue(snapshot.participantReceive3, participants[2] ?? ""),
    successOutcome1: toStringValue(snapshot.successOutcome1, outcomes[0] ?? ""),
    successOutcome2: toStringValue(snapshot.successOutcome2, outcomes[1] ?? ""),
    successOutcome3: toStringValue(snapshot.successOutcome3, outcomes[2] ?? ""),
    pilotPeopleServed: toNumberValue(snapshot.pilotPeopleServed, 25),
    staffCount: toNumberValue(snapshot.staffCount, 2),
    volunteerCount: toNumberValue(snapshot.volunteerCount, 0),
    staffRoles,
    startMonth: toStringValue(snapshot.startMonth, toMonthInput(program.start_date)),
    durationLabel: toStringValue(snapshot.durationLabel, toStringValue(program.duration_label)),
    frequency: toStringValue(snapshot.frequency, "Weekly"),
    locationMode,
    locationDetails: toStringValue(snapshot.locationDetails, toStringValue(program.location)),
    budgetUsd: toNumberValue(snapshot.budgetUsd, Math.round((program.goal_cents ?? 0) / 100)),
    costStaffUsd: toNumberValue(snapshot.costStaffUsd, 0),
    costSpaceUsd: toNumberValue(snapshot.costSpaceUsd, 0),
    costMaterialsUsd: toNumberValue(snapshot.costMaterialsUsd, 0),
    costOtherUsd: toNumberValue(snapshot.costOtherUsd, 0),
    fundingSource: toStringValue(snapshot.fundingSource),
    statusLabel: toStringValue(snapshot.statusLabel, toStringValue(program.status_label, "Draft")),
    ctaLabel: toStringValue(snapshot.ctaLabel, toStringValue(program.cta_label, "Learn more")),
    ctaUrl: toStringValue(snapshot.ctaUrl, toStringValue(program.cta_url)),
    goalUsd: toNumberValue(snapshot.goalUsd, Math.round((program.goal_cents ?? 0) / 100)),
    raisedUsd: toNumberValue(snapshot.raisedUsd, Math.round((program.raised_cents ?? 0) / 100)),
    features,
    isPublic: typeof program.is_public === "boolean" ? program.is_public : defaultProgramWizardForm.isPublic,
  }
}

function serializePayload(form: ProgramWizardFormState): CreateProgramPayload {
  const formatAddons = normalizeAddons(form.coreFormat, form.formatAddons)
  const locationType = form.locationMode === "online" ? "online" : "in_person"
  const location =
    form.locationDetails.trim() ||
    (form.locationMode === "online" ? "Online" : form.locationMode === "hybrid" ? "Hybrid" : "In person")

  const participantReceives = [
    form.participantReceive1,
    form.participantReceive2,
    form.participantReceive3,
  ]
    .map((entry) => entry.trim())
    .filter(Boolean)

  const successOutcomes = [form.successOutcome1, form.successOutcome2, form.successOutcome3]
    .map((entry) => entry.trim())
    .filter(Boolean)

  const feasibility = computeFeasibility(form)

  const wizardSnapshot = {
    version: 1,
    title: form.title.trim(),
    oneSentence: form.oneSentence.trim(),
    subtitle: form.subtitle.trim(),
    imageUrl: form.imageUrl.trim(),
    programType: form.programType,
    coreFormat: form.coreFormat,
    formatAddons,
    servesWho: form.servesWho.trim(),
    eligibilityRules: form.eligibilityRules.trim(),
    participantReceive1: form.participantReceive1.trim(),
    participantReceive2: form.participantReceive2.trim(),
    participantReceive3: form.participantReceive3.trim(),
    participantReceives,
    successOutcome1: form.successOutcome1.trim(),
    successOutcome2: form.successOutcome2.trim(),
    successOutcome3: form.successOutcome3.trim(),
    successOutcomes,
    pilotPeopleServed: Number(form.pilotPeopleServed),
    staffCount: Number(form.staffCount),
    volunteerCount: Number(form.volunteerCount),
    staffRoles: form.staffRoles,
    startMonth: form.startMonth,
    durationLabel: form.durationLabel.trim(),
    frequency: form.frequency.trim(),
    locationMode: form.locationMode,
    locationDetails: form.locationDetails.trim(),
    budgetUsd: Number(form.budgetUsd),
    costStaffUsd: Number(form.costStaffUsd),
    costSpaceUsd: Number(form.costSpaceUsd),
    costMaterialsUsd: Number(form.costMaterialsUsd),
    costOtherUsd: Number(form.costOtherUsd),
    fundingSource: form.fundingSource.trim(),
    ctaLabel: form.ctaLabel?.trim() ?? "",
    ctaUrl: form.ctaUrl?.trim() ?? "",
    statusLabel: form.statusLabel?.trim() ?? "Draft",
    metrics: {
      costPerParticipant: feasibility.costPerParticipant,
      participantsPerStaff: feasibility.participantsPerStaff,
      serviceIntensity: feasibility.serviceIntensity,
      flags: feasibility.flags,
    },
    updatedAt: new Date().toISOString(),
  }

  const features = [form.programType, form.coreFormat, ...formatAddons]

  return {
    title: form.title.trim(),
    subtitle: form.subtitle.trim() || null,
    description: form.oneSentence.trim(),
    location,
    locationType,
    locationUrl: locationType === "online" ? null : null,
    imageUrl: form.imageUrl.trim() || null,
    duration: form.durationLabel.trim() || null,
    startDate: monthToIsoStart(form.startMonth),
    endDate: null,
    features,
    statusLabel: form.statusLabel?.trim() || "Draft",
    goalCents: Math.round(Number(form.budgetUsd) * 100),
    raisedCents: Math.round(Number(form.raisedUsd) * 100),
    isPublic: Boolean(form.isPublic),
    ctaLabel: form.ctaLabel?.trim() || "Learn more",
    ctaUrl: form.ctaUrl?.trim() || null,
    wizardSnapshot,
  }
}

function summaryText(form: ProgramWizardFormState) {
  const participantReceives = [
    form.participantReceive1,
    form.participantReceive2,
    form.participantReceive3,
  ]
    .map((entry) => entry.trim())
    .filter(Boolean)

  const outcomes = [form.successOutcome1, form.successOutcome2, form.successOutcome3]
    .map((entry) => entry.trim())
    .filter(Boolean)

  const feasibility = computeFeasibility(form)

  return [
    `Program Brief: ${form.title.trim() || "Untitled program"}`,
    ``,
    `Summary: ${form.oneSentence.trim() || "Not set"}`,
    `Type: ${form.programType}`,
    `Delivery: ${form.coreFormat}${form.formatAddons.length > 0 ? ` + ${form.formatAddons.join(", ")}` : ""}`,
    ``,
    `Who is served: ${form.servesWho.trim() || "Not set"}`,
    `Eligibility: ${form.eligibilityRules.trim() || "Not set"}`,
    `Participants receive: ${participantReceives.length > 0 ? participantReceives.join("; ") : "Not set"}`,
    `Outcomes: ${outcomes.length > 0 ? outcomes.join("; ") : "Not set"}`,
    ``,
    `Pilot size: ${form.pilotPeopleServed} participants`,
    `Staffing: ${form.staffCount} staff, ${form.volunteerCount} volunteers`,
    `Start month: ${form.startMonth || "Not set"}`,
    `Duration: ${form.durationLabel.trim() || "Not set"}`,
    `Frequency: ${form.frequency.trim() || "Not set"}`,
    `Location: ${form.locationMode}${form.locationDetails.trim() ? ` (${form.locationDetails.trim()})` : ""}`,
    `Budget: ${money(Number(form.budgetUsd))}`,
    `Cost per participant: ${money(feasibility.costPerParticipant)}`,
    `Staff ratio: ${ratio(feasibility.participantsPerStaff)}`,
    `Estimated service intensity: ${
      feasibility.serviceIntensity !== null ? `${feasibility.serviceIntensity} sessions` : "Not enough data"
    }`,
    `Feasibility flags: ${feasibility.flags.length > 0 ? feasibility.flags.join("; ") : "None"}`,
  ].join("\n")
}

function parseErrors(form: ProgramWizardFormState) {
  const parsed = ProgramWizardSchema.safeParse(form)
  if (parsed.success) return {}
  const next: Record<string, string> = {}
  parsed.error.issues.forEach((issue) => {
    const key = issue.path[0]
    if (typeof key === "string" && !next[key]) {
      next[key] = issue.message
    }
  })
  return next
}

function requiredFieldsForStep(step: number): Array<keyof ProgramWizardFormState> {
  switch (step) {
    case 0:
      return ["title", "oneSentence"]
    case 1:
      return ["programType", "coreFormat"]
    case 2:
      return [
        "servesWho",
        "participantReceive1",
        "participantReceive2",
        "participantReceive3",
        "successOutcome1",
      ]
    case 3:
      return ["pilotPeopleServed", "staffCount"]
    case 4:
      return ["startMonth", "durationLabel", "frequency", "locationMode"]
    case 5:
      return ["budgetUsd"]
    default:
      return []
  }
}

function stepForField(field: string) {
  const stepMap: Record<string, number> = {
    title: 0,
    oneSentence: 0,
    subtitle: 0,
    imageUrl: 0,
    programType: 1,
    coreFormat: 1,
    formatAddons: 1,
    servesWho: 2,
    eligibilityRules: 2,
    participantReceive1: 2,
    participantReceive2: 2,
    participantReceive3: 2,
    successOutcome1: 2,
    successOutcome2: 2,
    successOutcome3: 2,
    pilotPeopleServed: 3,
    staffCount: 3,
    volunteerCount: 3,
    startMonth: 4,
    durationLabel: 4,
    frequency: 4,
    locationMode: 4,
    locationDetails: 4,
    budgetUsd: 5,
  }
  return stepMap[field] ?? 0
}

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
  const [errors, setErrors] = useState<Record<string, string>>({})
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
            Array.isArray(parsed.formatAddons) ? parsed.formatAddons.map(String) : fallback.formatAddons,
          ),
          staffRoles: Array.isArray(parsed.staffRoles)
            ? parsed.staffRoles
                .filter((entry) => isRecord(entry))
                .map((entry) => ({
                  role: toStringValue(entry.role),
                  hoursPerWeek: toNumberValue(entry.hoursPerWeek, 0),
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
      const response = mode === "edit" && program?.id
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

  const resolvedTrigger = triggerLabel ?? (
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

        <header className="border-b border-border/60 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Program setup</p>
              <h2 className="text-lg font-semibold sm:text-xl">{STEPS[currentStep].title}</h2>
              <p className="text-sm text-muted-foreground">{STEPS[currentStep].helper}</p>
            </div>
            <div className="flex items-center gap-2">
              {mode === "edit" ? (
                <Badge variant="secondary" className="rounded-full text-[11px]">
                  {isAutoSaving ? "Saving..." : "Autosave on"}
                </Badge>
              ) : null}
              <Badge variant="outline" className="rounded-full text-[11px]">
                Step {currentStep + 1} of {STEPS.length}
              </Badge>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <Progress value={completion} aria-label="Program builder progress" />
            <div className="flex flex-wrap gap-1.5">
              {STEPS.map((step, index) => (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setCurrentStep(index)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                    index === currentStep
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {index + 1}. {step.title}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          {currentStep === 0 ? (
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="programTitle">Program name</Label>
                <Input
                  id="programTitle"
                  value={form.title}
                  onChange={(event) => update({ title: event.currentTarget.value })}
                  placeholder="Community Career Bridge"
                  className="text-base"
                />
                {errors.title ? <p className="text-xs text-destructive">{errors.title}</p> : null}
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="oneSentence">One-sentence description</Label>
                <Textarea
                  id="oneSentence"
                  value={form.oneSentence}
                  onChange={(event) => update({ oneSentence: event.currentTarget.value })}
                  placeholder="Describe the program in one clear sentence."
                  className="min-h-[96px] text-base"
                />
                {errors.oneSentence ? <p className="text-xs text-destructive">{errors.oneSentence}</p> : null}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="programSubtitle">Subtitle (optional)</Label>
                <Input
                  id="programSubtitle"
                  value={form.subtitle}
                  onChange={(event) => update({ subtitle: event.currentTarget.value })}
                  placeholder="Spring cohort for new board leaders"
                  className="text-base"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="imageUrl">Image URL (optional)</Label>
                <Input
                  id="imageUrl"
                  value={form.imageUrl}
                  onChange={(event) => update({ imageUrl: event.currentTarget.value })}
                  placeholder="https://..."
                  className="text-base"
                />
              </div>
            </section>
          ) : null}

          {currentStep === 1 ? (
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Program type</Label>
                <Select
                  value={form.programType}
                  onValueChange={(value) => update({ programType: value as ProgramWizardFormState["programType"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRAM_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.programType ? <p className="text-xs text-destructive">{errors.programType}</p> : null}
              </div>
              <div className="grid gap-1.5">
                <Label>Core format</Label>
                <Select
                  value={form.coreFormat}
                  onValueChange={(value) => update({ coreFormat: value as ProgramWizardFormState["coreFormat"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose core format" />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERY_FORMATS.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.coreFormat ? <p className="text-xs text-destructive">{errors.coreFormat}</p> : null}
              </div>
              <div className="sm:col-span-2">
                <Label>Add-ons (optional)</Label>
                <p className="mb-2 mt-1 text-xs text-muted-foreground">
                  Pick extra delivery modes beyond your core format.
                </p>
                <div className="flex flex-wrap gap-2">
                  {DELIVERY_FORMATS.filter((format) => format !== form.coreFormat).map((format) => {
                    const selected = form.formatAddons.includes(format)
                    return (
                      <Button
                        key={format}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        size="sm"
                        className="h-8"
                        onClick={() => {
                          const next = selected
                            ? form.formatAddons.filter((entry) => entry !== format)
                            : [...form.formatAddons, format]
                          update({ formatAddons: next })
                        }}
                      >
                        {format}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </section>
          ) : null}

          {currentStep === 2 ? (
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="servesWho">Who you serve</Label>
                <Textarea
                  id="servesWho"
                  value={form.servesWho}
                  onChange={(event) => update({ servesWho: event.currentTarget.value })}
                  placeholder="Young adults transitioning into mission-driven careers"
                  className="min-h-[90px] text-base"
                />
                {errors.servesWho ? <p className="text-xs text-destructive">{errors.servesWho}</p> : null}
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="eligibilityRules">Eligibility rules (optional)</Label>
                <Input
                  id="eligibilityRules"
                  value={form.eligibilityRules}
                  onChange={(event) => update({ eligibilityRules: event.currentTarget.value })}
                  placeholder="Ages 18-24, resident in county"
                  className="text-base"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="receive1">Participants receive 1</Label>
                <Input
                  id="receive1"
                  value={form.participantReceive1}
                  onChange={(event) => update({ participantReceive1: event.currentTarget.value })}
                  placeholder="Weekly coaching"
                  className="text-base"
                />
                {errors.participantReceive1 ? <p className="text-xs text-destructive">{errors.participantReceive1}</p> : null}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="receive2">Participants receive 2</Label>
                <Input
                  id="receive2"
                  value={form.participantReceive2}
                  onChange={(event) => update({ participantReceive2: event.currentTarget.value })}
                  placeholder="Career readiness toolkit"
                  className="text-base"
                />
                {errors.participantReceive2 ? <p className="text-xs text-destructive">{errors.participantReceive2}</p> : null}
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="receive3">Participants receive 3</Label>
                <Input
                  id="receive3"
                  value={form.participantReceive3}
                  onChange={(event) => update({ participantReceive3: event.currentTarget.value })}
                  placeholder="Employer introductions"
                  className="text-base"
                />
                {errors.participantReceive3 ? <p className="text-xs text-destructive">{errors.participantReceive3}</p> : null}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="outcome1">Success outcome 1</Label>
                <Input
                  id="outcome1"
                  value={form.successOutcome1}
                  onChange={(event) => update({ successOutcome1: event.currentTarget.value })}
                  placeholder="80% complete capstone"
                  className="text-base"
                />
                {errors.successOutcome1 ? <p className="text-xs text-destructive">{errors.successOutcome1}</p> : null}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="outcome2">Success outcome 2 (optional)</Label>
                <Input
                  id="outcome2"
                  value={form.successOutcome2}
                  onChange={(event) => update({ successOutcome2: event.currentTarget.value })}
                  placeholder="50% placed into paid internships"
                  className="text-base"
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="outcome3">Success outcome 3 (optional)</Label>
                <Input
                  id="outcome3"
                  value={form.successOutcome3}
                  onChange={(event) => update({ successOutcome3: event.currentTarget.value })}
                  placeholder="Participant confidence score +20%"
                  className="text-base"
                />
              </div>
            </section>
          ) : null}

          {currentStep === 3 ? (
            <section className="grid gap-4 sm:grid-cols-2">
              <NumberField
                id="peopleServed"
                label="People served (pilot target)"
                value={form.pilotPeopleServed}
                onChange={(value) => update({ pilotPeopleServed: value })}
                min={1}
                error={errors.pilotPeopleServed}
              />
              <NumberField
                id="staffCount"
                label="Staff count"
                value={form.staffCount}
                onChange={(value) => update({ staffCount: value })}
                min={1}
                error={errors.staffCount}
              />
              <NumberField
                id="volunteerCount"
                label="Volunteer count (optional)"
                value={form.volunteerCount}
                onChange={(value) => update({ volunteerCount: value })}
                min={0}
              />

              <div className="grid gap-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>Staff roles (optional)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      update({
                        staffRoles: [...form.staffRoles, { role: "", hoursPerWeek: 10 }],
                      })
                    }}
                  >
                    Add role
                  </Button>
                </div>
                {form.staffRoles.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    Add role + hours/week to clarify delivery capacity.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {form.staffRoles.map((entry, index) => (
                      <div key={`${entry.role}-${index}`} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_160px_auto]">
                        <Input
                          value={entry.role}
                          onChange={(event) => {
                            const next = [...form.staffRoles]
                            next[index] = { ...next[index], role: event.currentTarget.value }
                            update({ staffRoles: next })
                          }}
                          placeholder="Program coordinator"
                          className="text-base"
                        />
                        <Input
                          type="number"
                          min={0}
                          max={168}
                          value={entry.hoursPerWeek}
                          onChange={(event) => {
                            const next = [...form.staffRoles]
                            next[index] = {
                              ...next[index],
                              hoursPerWeek: Number(event.currentTarget.value || "0"),
                            }
                            update({ staffRoles: next })
                          }}
                          placeholder="Hours/week"
                          className="text-base"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10"
                          onClick={() => {
                            const next = form.staffRoles.filter((_, roleIndex) => roleIndex !== index)
                            update({ staffRoles: next })
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {currentStep === 4 ? (
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="startMonth">Start month</Label>
                <Input
                  id="startMonth"
                  type="month"
                  value={form.startMonth}
                  onChange={(event) => update({ startMonth: event.currentTarget.value })}
                  className="text-base"
                />
                {errors.startMonth ? <p className="text-xs text-destructive">{errors.startMonth}</p> : null}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="durationLabel">Duration</Label>
                <Input
                  id="durationLabel"
                  value={form.durationLabel}
                  onChange={(event) => update({ durationLabel: event.currentTarget.value })}
                  placeholder="12 weeks"
                  className="text-base"
                />
                {errors.durationLabel ? <p className="text-xs text-destructive">{errors.durationLabel}</p> : null}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={form.frequency} onValueChange={(value) => update({ frequency: value })}>
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Biweekly">Biweekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Twice weekly">Twice weekly</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {errors.frequency ? <p className="text-xs text-destructive">{errors.frequency}</p> : null}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="locationMode">Location mode</Label>
                <Select
                  value={form.locationMode}
                  onValueChange={(value) => update({ locationMode: value as ProgramWizardFormState["locationMode"] })}
                >
                  <SelectTrigger id="locationMode">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">In-person</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
                {errors.locationMode ? <p className="text-xs text-destructive">{errors.locationMode}</p> : null}
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="locationDetails">Location details (optional)</Label>
                <Input
                  id="locationDetails"
                  value={form.locationDetails}
                  onChange={(event) => update({ locationDetails: event.currentTarget.value })}
                  placeholder="South Side Community Center"
                  className="text-base"
                />
              </div>
            </section>
          ) : null}

          {currentStep === 5 ? (
            <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  id="budgetUsd"
                  label="Total pilot budget (USD)"
                  value={form.budgetUsd}
                  onChange={(value) => update({ budgetUsd: value })}
                  min={1}
                  error={errors.budgetUsd}
                />
                <div className="grid gap-1.5">
                  <Label htmlFor="fundingSource">Funding source (optional)</Label>
                  <Input
                    id="fundingSource"
                    value={form.fundingSource}
                    onChange={(event) => update({ fundingSource: event.currentTarget.value })}
                    placeholder="Foundation grant + donor circle"
                    className="text-base"
                  />
                </div>

                <NumberField
                  id="costStaffUsd"
                  label="Cost bucket: staff"
                  value={form.costStaffUsd}
                  onChange={(value) => update({ costStaffUsd: value })}
                  min={0}
                />
                <NumberField
                  id="costSpaceUsd"
                  label="Cost bucket: space"
                  value={form.costSpaceUsd}
                  onChange={(value) => update({ costSpaceUsd: value })}
                  min={0}
                />
                <NumberField
                  id="costMaterialsUsd"
                  label="Cost bucket: materials"
                  value={form.costMaterialsUsd}
                  onChange={(value) => update({ costMaterialsUsd: value })}
                  min={0}
                />
                <NumberField
                  id="costOtherUsd"
                  label="Cost bucket: other"
                  value={form.costOtherUsd}
                  onChange={(value) => update({ costOtherUsd: value })}
                  min={0}
                />
              </div>

              <aside className="space-y-3 rounded-xl border bg-muted/25 p-4">
                <h3 className="text-sm font-semibold">Instant feasibility snapshot</h3>
                <MetricRow label="Cost per participant" value={money(feasibility.costPerParticipant)} />
                <MetricRow label="Staff-to-participant ratio" value={ratio(feasibility.participantsPerStaff)} />
                <MetricRow
                  label="Estimated service intensity"
                  value={
                    feasibility.serviceIntensity !== null
                      ? `${feasibility.serviceIntensity} sessions`
                      : "Not enough data"
                  }
                />
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Flags</p>
                  {feasibility.flags.length > 0 ? (
                    <ul className="space-y-1">
                      {feasibility.flags.map((flag) => (
                        <li key={flag} className="text-sm text-foreground">
                          - {flag}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No feasibility flags right now.</p>
                  )}
                </div>
              </aside>
            </section>
          ) : null}

          {currentStep === 6 ? (
            <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <article className="space-y-4 rounded-xl border p-4">
                <div>
                  <h3 className="text-lg font-semibold">{form.title || "Untitled program"}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {form.oneSentence || "Add one-sentence description in Step 1."}
                  </p>
                </div>

                <Separator />

                <div className="grid gap-3 sm:grid-cols-2">
                  <SummaryBlock label="Type" value={form.programType} />
                  <SummaryBlock
                    label="Format"
                    value={`${form.coreFormat}${
                      form.formatAddons.length > 0 ? ` + ${form.formatAddons.join(", ")}` : ""
                    }`}
                  />
                  <SummaryBlock label="Who" value={form.servesWho || "Not set"} />
                  <SummaryBlock
                    label="Participants receive"
                    value={[form.participantReceive1, form.participantReceive2, form.participantReceive3]
                      .filter(Boolean)
                      .join("; ") || "Not set"}
                  />
                  <SummaryBlock
                    label="Outcomes"
                    value={[form.successOutcome1, form.successOutcome2, form.successOutcome3]
                      .filter(Boolean)
                      .join("; ") || "Not set"}
                  />
                  <SummaryBlock
                    label="Pilot + staffing"
                    value={`${form.pilotPeopleServed} served, ${form.staffCount} staff, ${form.volunteerCount} volunteers`}
                  />
                  <SummaryBlock
                    label="Schedule"
                    value={`${form.startMonth || "No start"} • ${form.durationLabel || "No duration"} • ${form.frequency || "No frequency"}`}
                  />
                  <SummaryBlock
                    label="Location"
                    value={`${form.locationMode}${form.locationDetails ? ` • ${form.locationDetails}` : ""}`}
                  />
                  <SummaryBlock label="Budget" value={money(Number(form.budgetUsd))} />
                  <SummaryBlock label="Funding source" value={form.fundingSource || "Not set"} />
                </div>
              </article>

              <aside className="space-y-3 rounded-xl border bg-muted/25 p-4">
                <h3 className="text-sm font-semibold">Program brief actions</h3>
                <Button type="button" variant="outline" className="w-full justify-start" onClick={copyBrief}>
                  <CopyIcon className="h-4 w-4" aria-hidden />
                  Copy brief
                </Button>
                <p className="text-xs text-muted-foreground">
                  Copy the generated brief and share with staff, board, and funders.
                </p>
              </aside>
            </section>
          ) : null}
        </div>

        <footer className="border-t border-border/60 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" className="h-9" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={goPrevious}
                disabled={currentStep === 0}
              >
                Back
              </Button>
            </div>
            {currentStep < STEPS.length - 1 ? (
              <Button type="button" className="h-9" onClick={goNext}>
                Continue
              </Button>
            ) : (
              <Button type="button" className="h-9" onClick={submit} disabled={isPending}>
                {isPending
                  ? mode === "create"
                    ? "Generating..."
                    : "Saving..."
                  : mode === "create"
                    ? "Generate brief"
                    : "Save brief"}
              </Button>
            )}
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  )
}

type NumberFieldProps = {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  error?: string
}

function NumberField({ id, label, value, onChange, min, error }: NumberFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.currentTarget.value || "0"))}
        className="text-base"
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

type MetricRowProps = {
  label: string
  value: string
}

function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className="rounded-lg border bg-background/60 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}

type SummaryBlockProps = {
  label: string
  value: string
}

function SummaryBlock({ label, value }: SummaryBlockProps) {
  return (
    <div className="rounded-lg border bg-background/70 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  )
}
