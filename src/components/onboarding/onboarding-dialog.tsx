"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Cropper from "react-easy-crop"
import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"
import CameraIcon from "lucide-react/dist/esm/icons/camera"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import CircleDollarSignIcon from "lucide-react/dist/esm/icons/circle-dollar-sign"
import HammerIcon from "lucide-react/dist/esm/icons/hammer"
import SearchIcon from "lucide-react/dist/esm/icons/search"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"
import UsersIcon from "lucide-react/dist/esm/icons/users"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type FormationStatus = "pre_501c3" | "in_progress" | "approved"
type IntentFocus = "build" | "find" | "fund" | "support"
type RoleInterest = "staff" | "operator" | "volunteer" | "board_member"

const FORMATION_OPTIONS: Array<{
  value: FormationStatus
  label: string
  description: string
}> = [
  {
    value: "pre_501c3",
    label: "Pre-501(c)(3)",
    description: "Just getting started.",
  },
  {
    value: "in_progress",
    label: "In progress",
    description: "Formation is underway.",
  },
  {
    value: "approved",
    label: "Approved",
    description: "We have a determination letter.",
  },
]

export type OnboardingDialogProps = {
  open: boolean
  defaultEmail?: string | null
  defaultOrgName?: string | null
  defaultOrgSlug?: string | null
  defaultFormationStatus?: FormationStatus | null
  defaultIntentFocus?: IntentFocus | null
  defaultRoleInterest?: RoleInterest | null
  defaultFirstName?: string | null
  defaultLastName?: string | null
  defaultPhone?: string | null
  defaultPublicEmail?: string | null
  defaultTitle?: string | null
  defaultLinkedin?: string | null
  defaultAvatarUrl?: string | null
  defaultOptInUpdates?: boolean | null
  defaultNewsletterOptIn?: boolean | null
  onSubmit: (form: FormData) => Promise<void>
  presentation?: "dialog" | "inline"
}

type Step = {
  id: "intent" | "org" | "account"
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    id: "intent",
    title: "Choose your onboarding path",
    description:
      "Build nonprofits is available now. Find, Fund, and Support are coming soon.",
  },
  {
    id: "org",
    title: "Create your organization",
    description:
      "This is your nonprofit’s workspace. You can change this later.",
  },
  {
    id: "account",
    title: "Set up your account",
    description: "A few details so we can personalize your workspace.",
  },
]

const INTENT_OPTIONS: Array<{
  value: IntentFocus
  label: string
  description: string
  available: boolean
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    value: "build",
    label: "Build nonprofits",
    description: "Set up your organization, roadmap, and operating foundation.",
    available: true,
    icon: HammerIcon,
  },
  {
    value: "find",
    label: "Find nonprofits",
    description: "Discover organizations, initiatives, and partners.",
    available: false,
    icon: SearchIcon,
  },
  {
    value: "fund",
    label: "Fund nonprofits",
    description: "Support organizations and track funded outcomes.",
    available: false,
    icon: CircleDollarSignIcon,
  },
  {
    value: "support",
    label: "Support teams",
    description: "Help operators and teams execute mission-critical work.",
    available: false,
    icon: UsersIcon,
  },
]

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "signup",
  "pricing",
  "billing",
  "class",
  "dashboard",
  "people",
  "organization",
  "my-organization",
  "_next",
  "public",
  "favicon",
  "assets",
])

const DRAFT_VALUE_KEYS = [
  "intentFocus",
  "roleInterest",
  "orgName",
  "orgSlug",
  "firstName",
  "lastName",
  "phone",
  "publicEmail",
  "title",
  "linkedin",
] as const

const DRAFT_FLAG_KEYS = ["optInUpdates", "newsletterOptIn"] as const

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\\s-]/g, "")
    .trim()
    .replace(/\\s+/g, "-")
    .replace(/-+/g, "-")
  return base.slice(0, 60).replace(/^-+|-+$/g, "")
}

function resolveOnboardingError(raw: string | null) {
  switch (raw) {
    case "missing_org_name":
      return "Enter an organization name to continue."
    case "missing_org_slug":
      return "Enter an organization URL to continue."
    case "invalid_org_slug":
      return "That organization URL is invalid. Use letters, numbers, and hyphens."
    case "reserved_org_slug":
      return "That URL is reserved. Try something else."
    case "slug_taken":
      return "That URL is already taken. Try another."
    case "missing_intent_focus":
      return "Select your focus to continue."
    case "intent_focus_coming_soon":
      return "That onboarding focus is coming soon. Select Build nonprofits to continue."
    default:
      return null
  }
}

export function OnboardingDialog({
  open,
  defaultEmail,
  defaultOrgName,
  defaultOrgSlug,
  defaultFormationStatus,
  defaultIntentFocus,
  defaultRoleInterest,
  defaultFirstName,
  defaultLastName,
  defaultPhone,
  defaultPublicEmail,
  defaultTitle,
  defaultLinkedin,
  defaultAvatarUrl,
  defaultOptInUpdates,
  defaultNewsletterOptIn,
  onSubmit,
  presentation = "dialog",
}: OnboardingDialogProps) {
  const initialOrgName = (defaultOrgName ?? "").trim()
  const initialOrgSlug = slugify((defaultOrgSlug ?? "").trim() || initialOrgName)
  const initialFormationStatus: FormationStatus | "" =
    defaultFormationStatus === "pre_501c3" ||
    defaultFormationStatus === "in_progress" ||
    defaultFormationStatus === "approved"
      ? defaultFormationStatus
      : ""
  const initialIntentFocus: IntentFocus | "" =
    defaultIntentFocus === "build" ||
    defaultIntentFocus === "find" ||
    defaultIntentFocus === "fund" ||
    defaultIntentFocus === "support"
      ? defaultIntentFocus
      : "build"
  const initialRoleInterest: RoleInterest | "" =
    defaultRoleInterest === "staff" ||
    defaultRoleInterest === "operator" ||
    defaultRoleInterest === "volunteer" ||
    defaultRoleInterest === "board_member"
      ? defaultRoleInterest
      : ""
  const initialFirstName = (defaultFirstName ?? "").trim()
  const initialLastName = (defaultLastName ?? "").trim()
  const initialPhone = (defaultPhone ?? "").trim()
  const initialPublicEmail = (defaultPublicEmail ?? defaultEmail ?? "").trim()
  const initialTitle = (defaultTitle ?? "").trim()
  const initialLinkedin = (defaultLinkedin ?? "").trim()
  const initialAvatarUrl = (defaultAvatarUrl ?? "").trim() || null
  const initialOptInUpdates = defaultOptInUpdates ?? true
  const initialNewsletterOptIn = defaultNewsletterOptIn ?? true
  const persistedFieldDefaults = React.useMemo<Record<string, string>>(
    () => ({
      intentFocus: initialIntentFocus || "",
      roleInterest: initialRoleInterest || "",
      orgName: initialOrgName,
      orgSlug: initialOrgSlug,
      firstName: initialFirstName,
      lastName: initialLastName,
      phone: initialPhone,
      publicEmail: initialPublicEmail,
      title: initialTitle,
      linkedin: initialLinkedin,
    }),
    [
      initialIntentFocus,
      initialRoleInterest,
      initialOrgName,
      initialOrgSlug,
      initialFirstName,
      initialLastName,
      initialPhone,
      initialPublicEmail,
      initialTitle,
      initialLinkedin,
    ],
  )

  const resolveDraftFieldValue = React.useCallback(
    (key: string, draftValue: unknown) => {
      const value = typeof draftValue === "string" ? draftValue : ""
      if (value.trim().length > 0) return value
      return persistedFieldDefaults[key] ?? value
    },
    [persistedFieldDefaults],
  )

  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [slugEdited, setSlugEdited] = useState(false)
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "unavailable"
  >("idle")
  const [orgNameValue, setOrgNameValue] = useState(initialOrgName)
  const [orgSlugInputValue, setOrgSlugInputValue] = useState(initialOrgSlug)
  const [slugValue, setSlugValue] = useState(initialOrgSlug)
  const [slugHint, setSlugHint] = useState<string | null>(null)
  const [formationStatus, setFormationStatus] =
    useState<FormationStatus | "">(initialFormationStatus)
  const [intentFocus, setIntentFocus] = useState<IntentFocus | "">(initialIntentFocus)
  const [roleInterest, setRoleInterest] = useState<RoleInterest | "">(initialRoleInterest)

  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl)
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [attemptedStep, setAttemptedStep] = useState<number | null>(null)
  const [progressTarget, setProgressTarget] = useState(0)
  const [progressDisplay, setProgressDisplay] = useState(0)
  const progressDisplayRef = useRef(0)

  const currentStep = STEPS[Math.max(0, Math.min(step, STEPS.length - 1))]
  const progress = Math.round(progressDisplay)

  const syncProgress = React.useCallback(() => {
    const form = formRef.current
    if (!form) {
      setProgressTarget(0)
      return
    }

    const data = new FormData(form)
    const checks = [
      Boolean(intentFocus),
      String(data.get("orgName") ?? "").trim().length > 0,
      slugStatus === "available",
      Boolean(formationStatus),
      String(data.get("firstName") ?? "").trim().length > 0,
      String(data.get("lastName") ?? "").trim().length > 0,
    ]
    const completed = checks.filter(Boolean).length
    setProgressTarget(Math.round((completed / checks.length) * 100))
  }, [formationStatus, intentFocus, slugStatus])

  const rehydrateVisibleDraftFields = React.useCallback(() => {
    if (typeof window === "undefined" || !formRef.current) return

    const raw = window.localStorage.getItem("onboardingDraftV2")
    if (!raw) return

    try {
      const draft = JSON.parse(raw) as {
        values?: Record<string, string>
        flags?: { optInUpdates?: boolean; newsletterOptIn?: boolean }
      }

      if (draft.values) {
        for (const [key, value] of Object.entries(draft.values)) {
          const el = formRef.current.querySelector(`[name="${key}"]`) as
            | HTMLInputElement
            | HTMLTextAreaElement
            | null
          if (!el) continue
          el.value = resolveDraftFieldValue(key, value)
        }
        const draftOrgName = resolveDraftFieldValue("orgName", draft.values.orgName)
        if (draftOrgName) {
          setOrgNameValue(draftOrgName)
        }
        const draftOrgSlug = slugify(resolveDraftFieldValue("orgSlug", draft.values.orgSlug))
        if (draftOrgSlug) {
          setOrgSlugInputValue(draftOrgSlug)
        }
        const draftIntentFocus = resolveDraftFieldValue("intentFocus", draft.values.intentFocus)
        if (
          draftIntentFocus === "build" ||
          draftIntentFocus === "find" ||
          draftIntentFocus === "fund" ||
          draftIntentFocus === "support"
        ) {
          setIntentFocus(draftIntentFocus)
        }
        const draftRoleInterest = resolveDraftFieldValue("roleInterest", draft.values.roleInterest)
        if (
          draftRoleInterest === "staff" ||
          draftRoleInterest === "operator" ||
          draftRoleInterest === "volunteer" ||
          draftRoleInterest === "board_member"
        ) {
          setRoleInterest(draftRoleInterest)
        }
      }

      if (draft.flags?.optInUpdates !== undefined) {
        const cb = formRef.current.querySelector(
          'input[name="optInUpdates"][type="checkbox"]'
        ) as HTMLInputElement | null
        if (cb) cb.checked = Boolean(draft.flags.optInUpdates)
      }
      if (draft.flags?.newsletterOptIn !== undefined) {
        const cb = formRef.current.querySelector(
          'input[name="newsletterOptIn"][type="checkbox"]'
        ) as HTMLInputElement | null
        if (cb) cb.checked = Boolean(draft.flags.newsletterOptIn)
      }
    } catch {
      // ignore malformed draft
    }
  }, [resolveDraftFieldValue])

  const saveDraft = (
    extra?: Partial<{
      step: number
      formationStatus: FormationStatus | ""
      intentFocus: IntentFocus | ""
      roleInterest: RoleInterest | ""
      slugEdited: boolean
      avatar: string | null
    }>
  ) => {
    if (typeof window === "undefined" || !formRef.current) return
    const form = formRef.current
    const data = new FormData(form)
    let previousValues: Record<string, string> = {}
    let previousFlags: { optInUpdates?: boolean; newsletterOptIn?: boolean } = {}

    const existingRaw = window.localStorage.getItem("onboardingDraftV2")
    if (existingRaw) {
      try {
        const parsed = JSON.parse(existingRaw) as {
          values?: Record<string, string>
          flags?: { optInUpdates?: boolean; newsletterOptIn?: boolean }
        }
        if (parsed.values && typeof parsed.values === "object") {
          previousValues = parsed.values
        }
        if (parsed.flags && typeof parsed.flags === "object") {
          previousFlags = parsed.flags
        }
      } catch {
        // ignore malformed draft
      }
    }

    const nextValues: Record<string, string> = { ...previousValues }
    for (const key of DRAFT_VALUE_KEYS) {
      const field = form.querySelector(`[name="${key}"]`) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        | null
      if (field) {
        nextValues[key] = String(data.get(key) ?? "")
      }
    }

    const nextFlags = { ...previousFlags }
    for (const key of DRAFT_FLAG_KEYS) {
      const field = form.querySelector(`input[name="${key}"][type="checkbox"]`) as HTMLInputElement | null
      if (field) {
        nextFlags[key] = field.checked
      }
    }

    const payload = {
      step,
      formationStatus,
      intentFocus,
      roleInterest,
      slugEdited,
      avatar: avatarPreview,
      values: nextValues,
      flags: nextFlags,
    }

    const merged = {
      ...payload,
      ...(extra ?? {}),
    }

    window.localStorage.setItem("onboardingDraftV2", JSON.stringify(merged))
  }

  useEffect(() => {
    if (!open) return

    const msg = resolveOnboardingError(searchParams.get("error"))
    setServerError(msg)
  }, [open, searchParams])

  useEffect(() => {
    if (!open) return
    syncProgress()
  }, [open, syncProgress])

  useEffect(() => {
    progressDisplayRef.current = progressDisplay
  }, [progressDisplay])

  useEffect(() => {
    const from = progressDisplayRef.current
    const to = progressTarget
    if (Math.round(from) === Math.round(to)) {
      progressDisplayRef.current = to
      setProgressDisplay(to)
      return
    }

    let frameId = 0
    const start = performance.now()
    const durationMs = 260

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = from + (to - from) * eased
      progressDisplayRef.current = next
      setProgressDisplay(next)
      if (t < 1) {
        frameId = window.requestAnimationFrame(tick)
      }
    }

    frameId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameId)
  }, [progressTarget])

  useEffect(() => {
    if (!open) return
    if (typeof window === "undefined") return
    const raw = window.localStorage.getItem("onboardingDraftV2")
    if (!raw) return

    try {
      const draft = JSON.parse(raw) as {
        step?: number
        formationStatus?: FormationStatus | ""
        intentFocus?: IntentFocus | ""
        roleInterest?: RoleInterest | ""
        slugEdited?: boolean
        avatar?: string | null
        values?: Record<string, string>
        flags?: { optInUpdates?: boolean; newsletterOptIn?: boolean }
      }

      if (typeof draft.step === "number") {
        setStep(Math.max(0, Math.min(STEPS.length - 1, draft.step)))
      }
      if (
        draft.formationStatus === "pre_501c3" ||
        draft.formationStatus === "in_progress" ||
        draft.formationStatus === "approved"
      ) {
        setFormationStatus(draft.formationStatus)
      }
      if (
        draft.intentFocus === "build" ||
        draft.intentFocus === "find" ||
        draft.intentFocus === "fund" ||
        draft.intentFocus === "support"
      ) {
        setIntentFocus(draft.intentFocus)
      }
      if (
        draft.roleInterest === "staff" ||
        draft.roleInterest === "operator" ||
        draft.roleInterest === "volunteer" ||
        draft.roleInterest === "board_member"
      ) {
        setRoleInterest(draft.roleInterest)
      }
      setSlugEdited(Boolean(draft.slugEdited))
      if (typeof draft.avatar === "string" && draft.avatar.trim().length > 0) setAvatarPreview(draft.avatar)

      const form = formRef.current
      if (!form || !draft.values) return

      for (const [key, value] of Object.entries(draft.values)) {
        const el = form.querySelector(`[name="${key}"]`) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | null
        if (!el) continue
        el.value = resolveDraftFieldValue(key, value)
      }

      const orgName = resolveDraftFieldValue("orgName", draft.values.orgName)
      if (orgName) {
        setOrgNameValue(orgName)
      }

      const slug = resolveDraftFieldValue("orgSlug", draft.values.orgSlug)
      if (slug) {
        const normalizedSlug = slugify(slug)
        setSlugValue(normalizedSlug)
        setOrgSlugInputValue(normalizedSlug)
        setSlugHint(null)
      }
      if (
        resolveDraftFieldValue("intentFocus", draft.values.intentFocus) === "build" ||
        resolveDraftFieldValue("intentFocus", draft.values.intentFocus) === "find" ||
        resolveDraftFieldValue("intentFocus", draft.values.intentFocus) === "fund" ||
        resolveDraftFieldValue("intentFocus", draft.values.intentFocus) === "support"
      ) {
        setIntentFocus(resolveDraftFieldValue("intentFocus", draft.values.intentFocus) as IntentFocus)
      }
      if (
        resolveDraftFieldValue("roleInterest", draft.values.roleInterest) === "staff" ||
        resolveDraftFieldValue("roleInterest", draft.values.roleInterest) === "operator" ||
        resolveDraftFieldValue("roleInterest", draft.values.roleInterest) === "volunteer" ||
        resolveDraftFieldValue("roleInterest", draft.values.roleInterest) === "board_member"
      ) {
        setRoleInterest(resolveDraftFieldValue("roleInterest", draft.values.roleInterest) as RoleInterest)
      }

      if (draft.flags?.optInUpdates !== undefined) {
        const cb = form.querySelector(
          'input[name="optInUpdates"][type="checkbox"]'
        ) as HTMLInputElement | null
        if (cb) cb.checked = Boolean(draft.flags.optInUpdates)
      }
      if (draft.flags?.newsletterOptIn !== undefined) {
        const cb = form.querySelector(
          'input[name="newsletterOptIn"][type="checkbox"]'
        ) as HTMLInputElement | null
        if (cb) cb.checked = Boolean(draft.flags.newsletterOptIn)
      }
      window.requestAnimationFrame(() => {
        syncProgress()
      })
    } catch {
      // ignore
    }
  }, [open, resolveDraftFieldValue, syncProgress])

  useEffect(() => {
    if (!open) return
    if (typeof window === "undefined") return

    const frame = window.requestAnimationFrame(() => {
      rehydrateVisibleDraftFields()
      syncProgress()
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [open, step, rehydrateVisibleDraftFields, syncProgress])

  useEffect(() => {
    setAttemptedStep(null)
    setErrors({})
  }, [step])

  useEffect(() => {
    if (!open) return
    const normalized = slugify(slugValue)
    if (!normalized) {
      setSlugStatus("idle")
      setSlugHint(null)
      return
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
      setSlugStatus("unavailable")
      setSlugHint("Use letters, numbers, and hyphens.")
      return
    }
    if (RESERVED_SLUGS.has(normalized)) {
      setSlugStatus("unavailable")
      setSlugHint("That URL is reserved.")
      return
    }

    let mounted = true
    const controller = new AbortController()
    setSlugStatus("checking")
    setSlugHint(null)

    const id = window.setTimeout(() => {
      void fetch(
        `/api/public/organizations/slug-available?slug=${encodeURIComponent(normalized)}`,
        {
          method: "GET",
          signal: controller.signal,
        }
      )
        .then(async (res) => {
          const payload = (await res.json().catch(() => ({}))) as {
            available?: boolean
            error?: string
            slug?: string
          }
          if (!mounted) return
          if (!res.ok) {
            setSlugStatus("unavailable")
            setSlugHint(payload.error ?? "Unable to check URL right now.")
            return
          }
          if (payload.available) {
            setSlugStatus("available")
            setSlugHint(null)
          } else {
            setSlugStatus("unavailable")
            setSlugHint(payload.error ?? "That URL is not available.")
          }
        })
        .catch((error: unknown) => {
          if (!mounted) return
          if (error instanceof Error && error.name === "AbortError") return
          setSlugStatus("unavailable")
          setSlugHint("Unable to check URL right now.")
        })
    }, 350)

    return () => {
      mounted = false
      controller.abort()
      window.clearTimeout(id)
    }
  }, [open, slugValue])

  const validateStep = (idx: number) => {
    if (!formRef.current) return false
    setAttemptedStep(idx)
    const form = new FormData(formRef.current)
    const nextErrors: Record<string, string> = {}
    const active = STEPS[idx]?.id

    if (active === "intent") {
      const intent = String(form.get("intentFocus") ?? "").trim()
      if (intent !== "build") {
        nextErrors.intentFocus = "Select an available focus to continue"
      }
    }

    if (active === "org") {
      const orgName = String(form.get("orgName") ?? "").trim()
      const orgSlug = slugify(String(form.get("orgSlug") ?? "").trim())
      if (!orgName) nextErrors.orgName = "Organization name is required"
      if (!orgSlug) nextErrors.orgSlug = "Organization URL is required"
      if (!formationStatus) nextErrors.formationStatus = "Choose your formation status"
      if (slugStatus !== "available")
        nextErrors.orgSlug = slugHint ?? "Choose an available URL"
    }

    if (active === "account") {
      const firstName = String(form.get("firstName") ?? "").trim()
      const lastName = String(form.get("lastName") ?? "").trim()
      if (!firstName) nextErrors.firstName = "First name is required"
      if (!lastName) nextErrors.lastName = "Last name is required"
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const next = () => {
    setServerError(null)
    if (!validateStep(step)) return
    setErrors({})
    setAttemptedStep(null)
    setStep((prev) => {
      const value = Math.min(prev + 1, STEPS.length - 1)
      saveDraft({ step: value })
      return value
    })
  }

  const prev = () => {
    setServerError(null)
    setErrors({})
    setAttemptedStep(null)
    setStep((prev) => {
      const value = Math.max(prev - 1, 0)
      saveDraft({ step: value })
      return value
    })
  }

  const removeAvatar = () => {
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview)
    }
    if (rawImageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(rawImageUrl)
    }
    setAvatarPreview(null)
    setRawImageUrl(null)
    setCroppedArea(null)
    setCropOpen(false)
    setCrop({ x: 0, y: 0 })
    setZoom(1)

    const input = formRef.current?.querySelector(
      'input[name="avatar"]'
    ) as HTMLInputElement | null
    if (input) {
      input.value = ""
      try {
        const transfer = new DataTransfer()
        input.files = transfer.files
      } catch {
        // ignore
      }
    }

    saveDraft({ avatar: null })
  }

  const stepLabel = `Step ${step + 1} of ${STEPS.length}`
  const isInline = presentation === "inline"

  const content = (
    <>
      <form
        ref={formRef}
        action={onSubmit}
        className="relative flex min-h-0 flex-1 flex-col space-y-0"
        onChange={() => {
          saveDraft()
          syncProgress()
          if (STEPS[step]?.id === "account" && attemptedStep === step && formRef.current) {
            const data = new FormData(formRef.current)
            const firstName = String(data.get("firstName") ?? "").trim()
            const lastName = String(data.get("lastName") ?? "").trim()

            setErrors((prev) => {
              if (!prev.firstName && !prev.lastName) return prev
              const next = { ...prev }
              if (firstName) delete next.firstName
              if (lastName) delete next.lastName
              return next
            })

            if (firstName && lastName) {
              setAttemptedStep(null)
            }
          }
        }}
        onSubmit={(event) => {
          if (step !== STEPS.length - 1) {
            event.preventDefault()
            next()
            return
          }
          if (!validateStep(step)) {
            event.preventDefault()
            return
          }

          setSubmitting(true)
          saveDraft({ step })
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("onboardingDraftV2")
          }
        }}
      >
        <div className="border-border/70 border-b px-4 py-5 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                {stepLabel}
              </p>
              {isInline ? (
                <h2 className="text-foreground mt-1 text-2xl font-semibold">
                  {currentStep.title}
                </h2>
              ) : (
                <DialogTitle asChild>
                  <h2 className="text-foreground mt-1 text-2xl font-semibold">
                    {currentStep.title}
                  </h2>
                </DialogTitle>
              )}
              {isInline ? (
                <p className="text-muted-foreground mt-1 text-sm">
                  {currentStep.description}
                </p>
              ) : (
                <DialogDescription asChild>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {currentStep.description}
                  </p>
                </DialogDescription>
              )}
            </div>
            <div className="hidden sm:flex sm:flex-col sm:items-end sm:gap-2">
              <div className="bg-muted h-1.5 w-44 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-[width] duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-muted-foreground text-xs tabular-nums">
                {progress}%
              </span>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-0 md:px-6">
            <input type="hidden" name="intentFocus" value={intentFocus} />
            <input type="hidden" name="roleInterest" value={roleInterest} />
            <input
              type="hidden"
              name="formationStatus"
              value={formationStatus}
            />
            {currentStep.id !== "org" ? (
              <>
                <input type="hidden" name="orgName" value={orgNameValue} />
                <input type="hidden" name="orgSlug" value={orgSlugInputValue || slugValue} />
              </>
            ) : null}

            {serverError ? (
              <div className="border-destructive/30 bg-destructive/10 text-destructive mt-5 rounded-xl border px-4 py-3 text-sm">
                {serverError}
              </div>
            ) : null}

            {currentStep.id === "intent" ? (
              <div className="space-y-6 py-5">
                <div className="space-y-2">
                  <Label>Your focus</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {INTENT_OPTIONS.map((option) => {
                      const selected = intentFocus === option.value
                      const Icon = option.icon
                      const disabled = !option.available

                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={disabled}
                          aria-disabled={disabled}
                          onClick={() => {
                            if (!option.available) return
                            setIntentFocus(option.value)
                            setErrors((prev) => {
                              if (!prev.intentFocus) return prev
                              const next = { ...prev }
                              delete next.intentFocus
                              return next
                            })
                            saveDraft({ intentFocus: option.value })
                            syncProgress()
                          }}
                          className={cn(
                            "flex min-h-32 flex-col items-start gap-3 rounded-2xl border p-4 text-left transition",
                            disabled
                              ? "cursor-not-allowed border-border/60 bg-muted/35 opacity-80"
                              : selected
                                ? "border-primary/60 bg-primary/5"
                                : "border-border/70 bg-background/70 hover:bg-background",
                          )}
                        >
                          <div className="flex w-full items-start justify-between gap-2">
                            <span
                              className={cn(
                                "inline-flex h-9 w-9 items-center justify-center rounded-lg border",
                                selected
                                  ? "border-primary/50 bg-primary/10 text-primary"
                                  : "border-border/70 bg-background text-muted-foreground",
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            {!option.available ? (
                              <span className="inline-flex rounded-full border border-border/70 bg-muted/70 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                Coming soon
                              </span>
                            ) : null}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {attemptedStep === step && errors.intentFocus ? (
                    <p className="text-destructive text-xs">{errors.intentFocus}</p>
                  ) : null}
                </div>

              </div>
            ) : null}

            {currentStep.id === "org" ? (
              <div className="space-y-5 py-5">
                <div className="grid gap-2">
                  <Label htmlFor="orgName">Organization name</Label>
                  <Input
                    id="orgName"
                    name="orgName"
                    placeholder="Acme Inc."
                    defaultValue={initialOrgName}
                    aria-invalid={attemptedStep === step && Boolean(errors.orgName)}
                    onChange={(event) => {
                      const value = event.currentTarget.value
                      setOrgNameValue(value)
                      if (!slugEdited) {
                        const nextSlug = slugify(value)
                        setSlugValue(nextSlug)
                        setOrgSlugInputValue(nextSlug)
                        const input = formRef.current?.querySelector(
                          'input[name="orgSlug"]',
                        ) as HTMLInputElement | null
                        if (input) input.value = nextSlug
                      }
                    }}
                  />
                  <p className="text-muted-foreground text-xs">
                    Display name and public URL are separate. You can keep this name and change the URL if needed.
                  </p>
                  {attemptedStep === step && errors.orgName ? (
                    <p className="text-destructive text-xs">{errors.orgName}</p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="orgSlug">Organization URL</Label>
                  <div className="border-border/70 bg-background flex items-center gap-2 rounded-xl border px-3 py-1.5">
                    <span className="text-muted-foreground text-sm">coachhouse.org/</span>
                    <Input
                      id="orgSlug"
                      name="orgSlug"
                      placeholder="acme"
                      defaultValue={initialOrgSlug}
                      className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                      aria-invalid={attemptedStep === step && Boolean(errors.orgSlug)}
                      onChange={(event) => {
                        setSlugEdited(true)
                        const normalized = slugify(event.currentTarget.value)
                        setSlugValue(normalized)
                        setOrgSlugInputValue(normalized)
                        event.currentTarget.value = normalized
                      }}
                    />
                    {slugStatus === "available" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                        <CheckIcon className="h-3 w-3" aria-hidden />
                        Available
                      </span>
                    ) : slugStatus === "checking" ? (
                      <span className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-[11px] font-medium">
                        Checking…
                      </span>
                    ) : null}
                  </div>
                  {attemptedStep === step && errors.orgSlug ? (
                    <p className="text-destructive text-xs">{errors.orgSlug}</p>
                  ) : null}
                  {attemptedStep !== step && !errors.orgSlug && slugHint ? (
                    <p className="text-muted-foreground text-xs">{slugHint}</p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <Label>Formation status</Label>
                  <div
                    role="radiogroup"
                    aria-label="Formation status"
                    className="grid gap-2 sm:grid-cols-3"
                  >
                    {FORMATION_OPTIONS.map((option) => {
                      const selected = formationStatus === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => {
                            setFormationStatus(option.value)
                            saveDraft({ formationStatus: option.value })
                            syncProgress()
                          }}
                          className={cn(
                            "flex flex-col gap-2 rounded-2xl border p-3 text-left transition",
                            selected
                              ? "border-primary/60 bg-primary/5"
                              : "border-border/70 bg-background/60 hover:bg-background",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border",
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-transparent",
                            )}
                            aria-hidden
                          >
                            <CheckIcon className="h-3 w-3" />
                          </span>
                          <span className="w-full">
                            <span className="text-foreground block text-sm font-medium">{option.label}</span>
                            <span className="text-muted-foreground mt-0.5 block text-xs">
                              {option.description}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {attemptedStep === step && errors.formationStatus ? (
                    <p className="text-destructive text-xs">{errors.formationStatus}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {currentStep.id === "account" ? (
              <div className="space-y-5 py-5">
              <div className="border-border/70 bg-background/60 flex min-h-[10.5rem] flex-col items-center justify-center gap-3 rounded-2xl border px-4 py-6">
                <div className="relative size-16">
                  <div className="border-border bg-card h-full w-full overflow-hidden rounded-full border">
                    {avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt="Avatar preview"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm font-semibold">
                        CH
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute -right-1 -bottom-1 z-10 h-7 w-7 rounded-full"
                    aria-label={avatarPreview ? "Change profile photo" : "Upload profile photo"}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <CameraIcon className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
                <div className="text-muted-foreground text-xs">
                  Upload a profile picture (optional)
                </div>
                <input
                  id="avatar"
                  name="avatar"
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(ev) => {
                    const file = ev.currentTarget.files?.[0]
                    if (!file) return
                    const url = URL.createObjectURL(file)
                    setRawImageUrl(url)
                    setCrop({ x: 0, y: 0 })
                    setZoom(1)
                    setCroppedArea(null)
                    setCropOpen(true)
                  }}
                />
                {avatarPreview ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={submitting}
                    onClick={removeAvatar}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2Icon className="h-4 w-4" aria-hidden />
                    Remove photo
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    defaultValue={initialFirstName}
                    aria-invalid={attemptedStep === step && Boolean(errors.firstName)}
                  />
                  {attemptedStep === step && errors.firstName ? (
                    <p className="text-destructive text-xs">
                      {errors.firstName}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    defaultValue={initialLastName}
                    aria-invalid={attemptedStep === step && Boolean(errors.lastName)}
                  />
                  {attemptedStep === step && errors.lastName ? (
                    <p className="text-destructive text-xs">
                      {errors.lastName}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="(555) 555-5555"
                  defaultValue={initialPhone}
                />
                <p className="text-muted-foreground min-h-8 text-xs leading-4">Optional.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="publicEmail">
                    Public contact email <span className="text-muted-foreground">(public)</span>
                  </Label>
                  <Input
                    id="publicEmail"
                    name="publicEmail"
                    type="email"
                    placeholder="contact@yourorg.org"
                    defaultValue={initialPublicEmail}
                  />
                  <p className="text-muted-foreground text-xs">
                    Shown on your workspace/profile for collaborators.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Title (optional)</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Founder, Executive Director, etc."
                    defaultValue={initialTitle}
                  />
                  <p className="invisible text-xs">Optional.</p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="linkedin">LinkedIn (optional)</Label>
                <Input
                  id="linkedin"
                  name="linkedin"
                  placeholder="https://linkedin.com/in/…"
                  defaultValue={initialLinkedin}
                />
              </div>

              <div className="border-border/70 bg-background/60 space-y-3 rounded-2xl border p-4">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    name="optInUpdates"
                    defaultChecked={initialOptInUpdates}
                    className="mt-1 h-4 w-4"
                  />
                  <span className="space-y-0.5">
                    <span className="text-foreground block font-medium">
                      Product updates
                    </span>
                    <span className="text-muted-foreground block text-xs">
                      Tips, release notes, and announcements.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    name="newsletterOptIn"
                    defaultChecked={initialNewsletterOptIn}
                    className="mt-1 h-4 w-4"
                  />
                  <span className="space-y-0.5">
                    <span className="text-foreground block font-medium">
                      Newsletter
                    </span>
                    <span className="text-muted-foreground block text-xs">
                      Curated learning resources and community updates.
                    </span>
                  </span>
                </label>
                <div className="border-border/70 bg-muted/40 text-muted-foreground rounded-xl border px-3 py-2 text-xs">
                  Two‑factor authentication: we’ll prompt you to enable it
                  from Account settings after launch.
                </div>
              </div>
              </div>
            ) : null}
        </div>

        <div className="border-border/70 bg-background/40 relative z-20 shrink-0 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4 md:px-6">
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={prev}
                disabled={submitting}
              >
                Back
              </Button>
            ) : (
              <span className="text-muted-foreground text-xs">
                You’ll be able to change this later.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type={step === STEPS.length - 1 ? "submit" : "button"}
              onClick={step === STEPS.length - 1 ? undefined : next}
              disabled={
                submitting ||
                (currentStep.id === "intent" && intentFocus !== "build") ||
                (currentStep.id === "org" && (slugStatus !== "available" || !formationStatus))
              }
              className={cn(step === STEPS.length - 1 ? "gap-2" : "gap-2")}
            >
              {step === STEPS.length - 1 ? (
                <>
                  Finish
                  <ArrowRightIcon className="h-4 w-4" aria-hidden />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRightIcon className="h-4 w-4" aria-hidden />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className="w-[min(720px,92%)] overflow-hidden rounded-2xl p-0 sm:p-0">
          <div className="space-y-0">
            <div className="border-b px-6 py-4">
              <DialogTitle asChild>
                <h3 className="text-lg font-semibold">Adjust your photo</h3>
              </DialogTitle>
              <DialogDescription asChild>
                <p className="text-muted-foreground mt-1 text-sm">
                  Zoom and position the image, then apply.
                </p>
              </DialogDescription>
            </div>
            <div className="relative h-[320px] w-full bg-black/5">
              {rawImageUrl ? (
                <Cropper
                  image={rawImageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, area) => setCroppedArea(area)}
                />
              ) : null}
            </div>
            <div className="flex items-center justify-between border-t px-6 py-4">
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) =>
                  setZoom(Number(event.currentTarget.value))
                }
                className="accent-primary h-1 w-40"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCropOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    if (rawImageUrl && croppedArea) {
                      const blob = await getCroppedBlob(
                        rawImageUrl,
                        croppedArea
                      )
                      if (blob) {
                        const url = URL.createObjectURL(blob)
                        setAvatarPreview(url)
                        saveDraft({ avatar: url })

                        const file = new File([blob], "avatar.png", {
                          type: blob.type || "image/png",
                        })
                        const input = formRef.current?.querySelector(
                          'input[name="avatar"]'
                        ) as HTMLInputElement | null
                        if (input) {
                          const transfer = new DataTransfer()
                          transfer.items.add(file)
                          input.files = transfer.files
                        }
                      }
                    }
                    setCropOpen(false)
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )

  return (
    isInline ? (
      <div className="flex h-full w-full items-stretch md:mx-auto md:max-w-[680px] md:items-center">
        <section className="bg-card flex h-full max-h-full w-full flex-col overflow-hidden border-0 p-0 shadow-none md:mx-auto md:h-auto md:max-h-[min(78vh,820px)] md:rounded-3xl md:border md:border-border md:bg-card/80 md:shadow-none md:backdrop-blur">
          {content}
        </section>
      </div>
    ) : (
      <Dialog open={open}>
        <DialogContent className="border-border bg-card/80 flex max-h-[92vh] w-[min(720px,92%)] flex-col overflow-hidden rounded-3xl border p-0 shadow-2xl backdrop-blur">
          {content}
        </DialogContent>
      </Dialog>
    )
  )
}

async function getCroppedBlob(
  imageSrc: string,
  area: { x: number; y: number; width: number; height: number }
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      const size = Math.min(area.width, area.height)
      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext("2d")
      if (!ctx) return resolve(null)
      ctx.fillStyle = "#fff"
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(
        img,
        area.x,
        area.y,
        area.width,
        area.height,
        0,
        0,
        size,
        size
      )
      canvas.toBlob((blob) => resolve(blob), "image/png", 0.92)
    }
    img.onerror = () => resolve(null)
    img.src = imageSrc
  })
}
