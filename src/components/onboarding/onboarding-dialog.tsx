"use client"

import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Cropper from "react-easy-crop"
import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"

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
  onSubmit: (form: FormData) => Promise<void>
}

type Step = {
  id: "org" | "account"
  title: string
  description: string
}

const STEPS: Step[] = [
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
  "my-organization",
  "_next",
  "public",
  "favicon",
  "assets",
])

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
    default:
      return null
  }
}

export function OnboardingDialog({
  open,
  defaultEmail,
  onSubmit,
}: OnboardingDialogProps) {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [slugEdited, setSlugEdited] = useState(false)
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "unavailable"
  >("idle")
  const [slugValue, setSlugValue] = useState("")
  const [slugHint, setSlugHint] = useState<string | null>(null)
  const [formationStatus, setFormationStatus] =
    useState<FormationStatus>("in_progress")

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
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

  const currentStep = STEPS[Math.max(0, Math.min(step, STEPS.length - 1))]
  const progress = useMemo(
    () => Math.round(((step + 1) / STEPS.length) * 100),
    [step]
  )

  const saveDraft = (
    extra?: Partial<{
      step: number
      formationStatus: FormationStatus
      slugEdited: boolean
      avatar: string | null
    }>
  ) => {
    if (typeof window === "undefined" || !formRef.current) return
    const data = new FormData(formRef.current)
    const payload = {
      step,
      formationStatus,
      slugEdited,
      avatar: avatarPreview,
      values: Object.fromEntries(
        [
          "orgName",
          "orgSlug",
          "firstName",
          "lastName",
          "phone",
          "email",
          "title",
          "linkedin",
        ].map((k) => [k, String(data.get(k) ?? "")])
      ),
      flags: {
        optInUpdates: Boolean(data.get("optInUpdates")),
        newsletterOptIn: Boolean(data.get("newsletterOptIn")),
      },
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
    if (typeof window === "undefined") return
    const raw = window.localStorage.getItem("onboardingDraftV2")
    if (!raw) return

    try {
      const draft = JSON.parse(raw) as {
        step?: number
        formationStatus?: FormationStatus
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
      setSlugEdited(Boolean(draft.slugEdited))
      if (draft.avatar) setAvatarPreview(draft.avatar)

      const form = formRef.current
      if (!form || !draft.values) return

      for (const [key, value] of Object.entries(draft.values)) {
        const el = form.querySelector(`[name="${key}"]`) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | null
        if (!el) continue
        el.value = value
      }

      const slug = draft.values.orgSlug ?? ""
      if (slug) {
        setSlugValue(slugify(slug))
        setSlugHint(null)
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
    } catch {
      // ignore
    }
  }, [open])

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
    const form = new FormData(formRef.current)
    const nextErrors: Record<string, string> = {}
    const active = STEPS[idx]?.id

    if (active === "org") {
      const orgName = String(form.get("orgName") ?? "").trim()
      const orgSlug = slugify(String(form.get("orgSlug") ?? "").trim())
      if (!orgName) nextErrors.orgName = "Organization name is required"
      if (!orgSlug) nextErrors.orgSlug = "Organization URL is required"
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
    setStep((prev) => {
      const value = Math.min(prev + 1, STEPS.length - 1)
      saveDraft({ step: value })
      return value
    })
  }

  const prev = () => {
    setServerError(null)
    setStep((prev) => {
      const value = Math.max(prev - 1, 0)
      saveDraft({ step: value })
      return value
    })
  }

  const removeAvatar = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview)
    }
    if (rawImageUrl) {
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

  return (
    <Dialog open={open}>
      <DialogContent className="border-border bg-card/80 max-h-[92vh] w-[min(720px,92%)] overflow-hidden rounded-3xl border p-0 shadow-2xl backdrop-blur">
        <form
          ref={formRef}
          action={onSubmit}
          className="space-y-0"
          onChange={() => saveDraft()}
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
          <div className="border-border/70 border-b px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  {stepLabel}
                </p>
                <DialogTitle asChild>
                  <h2 className="text-foreground mt-1 text-2xl font-semibold">
                    {currentStep.title}
                  </h2>
                </DialogTitle>
                <DialogDescription asChild>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {currentStep.description}
                  </p>
                </DialogDescription>
              </div>
              <div className="hidden sm:flex sm:flex-col sm:items-end sm:gap-2">
                <div className="bg-muted h-1.5 w-44 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-muted-foreground text-xs">
                  {progress}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6">
            <input
              type="hidden"
              name="formationStatus"
              value={formationStatus}
            />

            {serverError ? (
              <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm">
                {serverError}
              </div>
            ) : null}

            {step === 0 ? (
              <div className="space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="orgName">Organization name</Label>
                  <Input
                    id="orgName"
                    name="orgName"
                    placeholder="Acme Inc."
                    aria-invalid={Boolean(errors.orgName)}
                    onChange={(event) => {
                      const value = event.currentTarget.value
                      if (!slugEdited) {
                        const nextSlug = slugify(value)
                        setSlugValue(nextSlug)
                        const input = formRef.current?.querySelector(
                          'input[name="orgSlug"]'
                        ) as HTMLInputElement | null
                        if (input) input.value = nextSlug
                      }
                    }}
                  />
                  {errors.orgName ? (
                    <p className="text-destructive text-xs">{errors.orgName}</p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="orgSlug">Organization URL</Label>
                  <div className="border-border/70 bg-background flex items-center gap-2 rounded-xl border px-3 py-1.5">
                    <span className="text-muted-foreground text-sm">
                      coachhouse.org/
                    </span>
                    <Input
                      id="orgSlug"
                      name="orgSlug"
                      placeholder="acme"
                      className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                      aria-invalid={Boolean(errors.orgSlug)}
                      onChange={(event) => {
                        setSlugEdited(true)
                        const normalized = slugify(event.currentTarget.value)
                        setSlugValue(normalized)
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
                  {errors.orgSlug ? (
                    <p className="text-destructive text-xs">{errors.orgSlug}</p>
                  ) : null}
                  {!errors.orgSlug && slugHint ? (
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
                          }}
                          className={cn(
                            "flex flex-col gap-2 rounded-2xl border p-3 text-left transition",
                            selected
                              ? "border-primary/60 bg-primary/5"
                              : "border-border/70 bg-background/60 hover:bg-background"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border",
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-transparent"
                            )}
                            aria-hidden
                          >
                            <CheckIcon className="h-3 w-3" />
                          </span>
                          <span className="w-full">
                            <span className="text-foreground block text-sm font-medium">
                              {option.label}
                            </span>
                            <span className="text-muted-foreground mt-0.5 block text-xs">
                              {option.description}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-5">
                <div className="border-border/70 bg-background/60 flex flex-col items-center gap-3 rounded-2xl border p-4">
                  <div className="border-border bg-card relative size-16 overflow-hidden rounded-full border">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm font-semibold">
                        CH
                      </div>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Upload a profile picture (optional)
                  </div>
                  <Input
                    id="avatar"
                    name="avatar"
                    type="file"
                    accept="image/*"
                    className="max-w-xs"
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
                      aria-invalid={Boolean(errors.firstName)}
                    />
                    {errors.firstName ? (
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
                      aria-invalid={Boolean(errors.lastName)}
                    />
                    {errors.lastName ? (
                      <p className="text-destructive text-xs">
                        {errors.lastName}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={defaultEmail ?? undefined}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(555) 555-5555"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title (optional)</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Founder, Executive Director, etc."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="linkedin">LinkedIn (optional)</Label>
                    <Input
                      id="linkedin"
                      name="linkedin"
                      placeholder="https://linkedin.com/in/…"
                    />
                  </div>
                </div>

                <div className="border-border/70 bg-background/60 space-y-3 rounded-2xl border p-4">
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      name="optInUpdates"
                      defaultChecked
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
                      defaultChecked
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

          <div className="border-border/70 bg-background/40 flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
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
                  submitting || (step === 0 && slugStatus !== "available")
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
      </DialogContent>
    </Dialog>
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
