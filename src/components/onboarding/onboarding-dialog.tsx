"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import NextImage from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Cropper from "react-easy-crop"

export type OnboardingDialogProps = {
  open: boolean
  defaultEmail?: string | null
  onSubmit: (form: FormData) => Promise<void>
  variant?: "basic" | "accelerator"
}

export function OnboardingDialog({ open, defaultEmail, onSubmit, variant = "accelerator" }: OnboardingDialogProps) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [confidenceOperating, setConfidenceOperating] = useState(6)
  const [confidenceFunding, setConfidenceFunding] = useState(5)
  const [confidenceFunders, setConfidenceFunders] = useState(5)
  const [followUpLater, setFollowUpLater] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  const steps = variant === "basic" ? BASIC_STEPS : FULL_STEPS

  // Load saved draft on mount
  useOnboardingDraft(formRef, setStep, steps.length - 1, setAvatarPreview, setFirstName, setLastName, {
    setOperatingScore: setConfidenceOperating,
    setFundingScore: setConfidenceFunding,
    setFundersScore: setConfidenceFunders,
    setFollowUp: setFollowUpLater,
  })

  function saveDraft(
    extra?: Partial<{
      avatar: string | null
      step: number
      values: Record<string, string>
      flags: Partial<{ optInUpdates: boolean; followUpLater: boolean }>
    }>,
  ) {
    if (typeof window === "undefined" || !formRef.current) return
    const data = new FormData(formRef.current)
    const draft: {
      step: number
      values: Record<string, string>
      flags: { optInUpdates: boolean; followUpLater: boolean }
      avatar: string | null
    } = {
      step,
      values: Object.fromEntries(
        [
          "firstName",
          "lastName",
          "phone",
          "email",
          "orgName",
          "orgDesc",
          "website",
          "social",
          "stage",
          "problem",
          "mission",
          "goals",
          "confidenceOperating",
          "confidenceFunding",
          "confidenceFunders",
          "confidenceNotes",
        ].map((k) => [k, String(data.get(k) ?? "")])
      ),
      flags: {
        optInUpdates: Boolean(data.get("optInUpdates")),
        followUpLater: Boolean(data.get("followUpLater")),
      },
      avatar: avatarPreview,
    }
    if (extra?.values) {
      draft.values = { ...draft.values, ...extra.values }
    }
    if (extra?.flags) {
      draft.flags = { ...draft.flags, ...extra.flags }
    }
    if (extra?.avatar !== undefined) draft.avatar = extra.avatar
    if (typeof extra?.step === "number") draft.step = extra.step
    window.localStorage.setItem("onboardingDraft", JSON.stringify(draft))
  }

  function next() {
    setStep((s) => {
      const n = Math.min(s + 1, steps.length - 1)
      saveDraft({ step: n })
      return n
    })
  }
  function prev() {
    setStep((s) => {
      const n = Math.max(s - 1, 0)
      saveDraft({ step: n })
      return n
    })
  }

  function validate(form: FormData, s: number): boolean {
    const newErrors: Record<string, string> = {}
    const currentStep = steps[s]?.id ?? "profile"
    if (currentStep === "profile") {
      if (!String(form.get("firstName") || "").trim()) newErrors.firstName = "First name is required"
      if (!String(form.get("lastName") || "").trim()) newErrors.lastName = "Last name is required"
      if (!String(form.get("phone") || "").trim()) newErrors.phone = "Phone is required"
      const email = String(form.get("email") || "").trim()
      if (!email) newErrors.email = "Email is required"
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Enter a valid email"
    } else if (currentStep === "organization") {
      if (!String(form.get("orgName") || "").trim()) newErrors.orgName = "Organization/Project name is required"
      if (!String(form.get("orgDesc") || "").trim()) newErrors.orgDesc = "Description is required"
    } else if (currentStep === "work") {
      if (!String(form.get("stage") || "").trim()) newErrors.stage = "Select your stage"
      if (!String(form.get("problem") || "").trim()) newErrors.problem = "Problem statement is required"
    } else if (currentStep === "confidence") {
      const confidenceFields: Array<{ key: keyof typeof newErrors; name: string }> = [
        { key: "confidenceOperating", name: "confidenceOperating" },
        { key: "confidenceFunding", name: "confidenceFunding" },
        { key: "confidenceFunders", name: "confidenceFunders" },
      ]
      confidenceFields.forEach(({ key, name }) => {
        const raw = Number(form.get(name) ?? NaN)
        if (!Number.isFinite(raw)) {
          newErrors[key as string] = "Please choose a value from 1–10"
        }
      })
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    if (step < steps.length - 1) {
      if (!validate(form, step)) return
      return next()
    }
    if (!validate(form, step)) return
    // Attach cropped avatar if present
    if (avatarPreview && rawImageUrl && croppedArea) {
      const blob = await getCroppedBlob(rawImageUrl, croppedArea)
      if (blob) form.set("avatar", new File([blob], "avatar.png", { type: blob.type || "image/png" }))
    }
    setSubmitting(true)
    await onSubmit(form)
    setSubmitting(false)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("onboardingDraft")
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-h-[92vh] w-[min(760px,92%)] overflow-y-auto rounded-2xl p-0 sm:p-0">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-0">
          <div className="border-b px-6 py-4">
            <p className="text-xs text-muted-foreground">Step {step + 1} of {steps.length}</p>
            <h2 className="mt-1 text-xl font-semibold">{steps[step].title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{steps[step].description}</p>
            {/* Progress dots */}
            <div className="mt-3 flex items-center gap-1.5">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={
                    "inline-block rounded-full transition " +
                    (i === step ? "size-2.5 bg-primary" : "size-2 bg-muted-foreground/50")
                  }
                />
              ))}
            </div>
          </div>
          <div className="space-y-5 p-6" onChange={() => saveDraft()}>
            <input type="hidden" name="onboardingVariant" value={variant} />
            {step === 0 && (
              <>
                <div className="flex flex-col items-center gap-3">
                  <div className="relative size-28 overflow-hidden rounded-full border border-border bg-card">
                    {avatarPreview ? (
                      <NextImage
                        src={avatarPreview}
                        alt="Avatar preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                        {(firstName[0] ?? "A").toUpperCase()}
                        {(lastName[0] ?? "A").toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Upload a profile picture (optional)</div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" required aria-invalid={Boolean(errors.firstName)} onChange={(e) => setFirstName(e.currentTarget.value)} />
                    {errors.firstName ? <p className="mt-1 text-xs text-destructive">{errors.firstName}</p> : null}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" required aria-invalid={Boolean(errors.lastName)} onChange={(e) => setLastName(e.currentTarget.value)} />
                    {errors.lastName ? <p className="mt-1 text-xs text-destructive">{errors.lastName}</p> : null}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" type="tel" required aria-invalid={Boolean(errors.phone)} />
                    {errors.phone ? <p className="mt-1 text-xs text-destructive">{errors.phone}</p> : null}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={defaultEmail ?? undefined} required aria-invalid={Boolean(errors.email)} />
                    {errors.email ? <p className="mt-1 text-xs text-destructive">{errors.email}</p> : null}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-[120px_1fr] sm:items-end">
                  <div>
                    <Label htmlFor="avatar">Profile picture</Label>
                    <Input
                      id="avatar"
                      name="avatar"
                      type="file"
                      accept="image/*"
                      onChange={(ev) => {
                        const f = ev.currentTarget.files?.[0]
                        if (f) {
                          const url = URL.createObjectURL(f)
                          setRawImageUrl(url)
                          setCropOpen(true)
                        }
                      }}
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" name="optInUpdates" defaultChecked className="h-4 w-4" />
                    Sign up for news and updates
                  </label>
                </div>
              </>
            )}
            {variant === "accelerator" && step === 1 && (
              <>
                <div>
                  <Label htmlFor="orgName">Organization/Project Name</Label>
                  <Input id="orgName" name="orgName" required aria-invalid={Boolean(errors.orgName)} />
                  {errors.orgName ? <p className="mt-1 text-xs text-destructive">{errors.orgName}</p> : null}
                </div>
                <div>
                  <Label htmlFor="orgDesc">Description</Label>
                  <Textarea id="orgDesc" name="orgDesc" required placeholder="Tell us about what you're building" aria-invalid={Boolean(errors.orgDesc)} />
                  {errors.orgDesc ? <p className="mt-1 text-xs text-destructive">{errors.orgDesc}</p> : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">http://</span>
                      <Input id="website" name="website" placeholder="example.com" className="flex-1" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="social">Social Media Username</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">@</span>
                      <Input id="social" name="social" placeholder="yourhandle" className="flex-1" />
                    </div>
                  </div>
                </div>
              </>
            )}
            {variant === "accelerator" && step === 2 && (
              <>
                <div>
                  <Label htmlFor="stage">Stage of your work</Label>
                  <select id="stage" name="stage" required aria-invalid={Boolean(errors.stage)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select a stage</option>
                    <option value="Idea">Idea</option>
                    <option value="Early">Early</option>
                    <option value="Active">Active</option>
                    <option value="Growth">Growth</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.stage ? <p className="mt-1 text-xs text-destructive">{errors.stage}</p> : null}
                </div>
                <div>
                  <Label htmlFor="problem">What problem are you trying to solve?</Label>
                  <Textarea id="problem" name="problem" required placeholder="1-2 sentences" aria-invalid={Boolean(errors.problem)} />
                  {errors.problem ? <p className="mt-1 text-xs text-destructive">{errors.problem}</p> : null}
                </div>
                <div>
                  <Label htmlFor="mission">What’s your mission or vision?</Label>
                  <Textarea id="mission" name="mission" placeholder="It's ok if you aren't sure yet!" />
                </div>
                <div>
                  <Label htmlFor="goals">What do you hope to get out of this accelerator?</Label>
                  <Textarea id="goals" name="goals" />
                </div>
              </>
            )}
            {variant === "accelerator" && step === 3 && (
              <>
                <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-primary">
                  Capture a quick “before” snapshot so we can celebrate how your confidence grows during the accelerator.
                </div>
                {[
                  {
                    id: "confidenceOperating",
                    label: "Operating as an organization",
                    description: "How ready do you feel to run the day-to-day operations of your organization?",
                    value: confidenceOperating,
                    setter: setConfidenceOperating,
                  },
                  {
                    id: "confidenceFunding",
                    label: "Being ready for funding",
                    description: "How confident are you in your financial model, budget, and readiness to accept funding?",
                    value: confidenceFunding,
                    setter: setConfidenceFunding,
                  },
                  {
                    id: "confidenceFunders",
                    label: "Finding & communicating with funders",
                    description: "How confident are you when it comes to identifying funders and telling your story to them?",
                    value: confidenceFunders,
                    setter: setConfidenceFunders,
                  },
                ].map(({ id, label, description, value, setter }) => (
                  <div key={id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={id}>{label}</Label>
                      <span className="text-sm font-semibold text-foreground">{value}/10</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{description}</p>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      id={id}
                      name={id}
                      value={value}
                      onChange={(event) => {
                        const next = Number(event.currentTarget.value)
                        setter(next)
                        saveDraft({ values: { [id]: String(next) } })
                      }}
                      className="mt-2 w-full accent-primary"
                    />
                    {errors[id] ? <p className="text-xs text-destructive">{errors[id]}</p> : null}
                  </div>
                ))}
                <div className="space-y-2">
                  <Label htmlFor="confidenceNotes">Context (optional)</Label>
                  <Textarea
                    id="confidenceNotes"
                    name="confidenceNotes"
                    placeholder="Share any context or notes about your confidence levels."
                  />
                </div>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    name="followUpLater"
                    className="mt-1 h-4 w-4 accent-primary"
                    checked={followUpLater}
                    onChange={(event) => {
                      setFollowUpLater(event.currentTarget.checked)
                      saveDraft({
                        flags: { followUpLater: event.currentTarget.checked },
                      })
                    }}
                  />
                  <span className="text-muted-foreground">
                    Remind me later to share a follow-up confidence snapshot.
                  </span>
                </label>
              </>
            )}
          </div>
          <div className="flex items-center justify-between border-t px-6 py-4">
            <Button type="button" variant="ghost" onClick={prev} disabled={step === 0 || submitting}>
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={submitting}>
                {step === steps.length - 1 ? (submitting ? "Submitting…" : "Finish") : "Continue"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
      {/* Cropper dialog */}
      <Dialog open={cropOpen}>
        <DialogContent className="w-[min(720px,92%)] rounded-2xl p-0 sm:p-0">
          <div className="space-y-0">
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-semibold">Adjust your profile picture</h3>
              <p className="mt-1 text-sm text-muted-foreground">Zoom and position the image, then apply.</p>
            </div>
            <div className="relative h-[320px] w-full">
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
              <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.currentTarget.value))} className="h-1 w-40 accent-primary" />
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setCropOpen(false)}>Cancel</Button>
                <Button
                  type="button"
                  onClick={async () => {
                    if (rawImageUrl && croppedArea) {
                      const blob = await getCroppedBlob(rawImageUrl, croppedArea)
                      if (blob) setAvatarPreview(URL.createObjectURL(blob))
                    }
                    setCropOpen(false)
                    saveDraft({ avatar: avatarPreview })
                  }}
                >Apply</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

const BASIC_STEPS = [
  {
    id: "profile",
    title: "Tell us about you",
    description: "Basic details to set up your profile.",
  },
]

const FULL_STEPS = [
  {
    id: "profile",
    title: "Tell us about you",
    description: "Basic details to set up your profile.",
  },
  {
    id: "organization",
    title: "Your organization or project",
    description: "Help us understand what you’re building.",
  },
  {
    id: "work",
    title: "Your work and goals",
    description: "Share your stage, focus, and goals.",
  },
  {
    id: "confidence",
    title: "Confidence snapshot",
    description: "Rate how ready you feel heading into the accelerator.",
  },
]

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
      const ctx = canvas.getContext("2d")!
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

// Load & apply draft from localStorage on mount
if (typeof window !== "undefined") {
  // noop to ensure file is treated as client-only
}

export function useOnboardingDraft(
  formRef: React.RefObject<HTMLFormElement | null>,
  setStep: (n: number) => void,
  maxStep: number,
  setAvatarPreview: (url: string | null) => void,
  setFirst: (v: string) => void,
  setLast: (v: string) => void,
  extras?: {
    setOperatingScore?: (value: number) => void
    setFundingScore?: (value: number) => void
    setFundersScore?: (value: number) => void
    setFollowUp?: (value: boolean) => void
  },
) {
  const { setOperatingScore, setFundingScore, setFundersScore, setFollowUp } = extras ?? {}

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = window.localStorage.getItem("onboardingDraft")
    if (!raw) return
    try {
      const draft = JSON.parse(raw) as {
        step?: number
        avatar?: string | null
        values?: Record<string, string>
        flags?: { optInUpdates?: boolean; followUpLater?: boolean }
      }
      if (typeof draft.step === "number") {
        const clampedStep = Math.max(0, Math.min(maxStep, draft.step))
        setStep(clampedStep)
      }
      if (draft.avatar) setAvatarPreview(draft.avatar)
      const form = formRef.current
      if (form && draft.values) {
        for (const [k, v] of Object.entries(draft.values)) {
          const el = form.querySelector(`[name="${k}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
          if (!el) continue
          if ((el as HTMLInputElement).type === "radio") {
            const radio = form.querySelector(`input[name="${k}"][value="${CSS.escape(v)}"]`) as HTMLInputElement | null
            if (radio) radio.checked = true
          } else {
            ;(el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value = v
          }
        }
        if (draft.flags?.optInUpdates !== undefined) {
          const cb = form.querySelector('input[name="optInUpdates"][type="checkbox"]') as HTMLInputElement | null
          if (cb) cb.checked = Boolean(draft.flags.optInUpdates)
        }
        if (draft.flags?.followUpLater !== undefined) {
          const followCb = form.querySelector('input[name="followUpLater"][type="checkbox"]') as HTMLInputElement | null
          if (followCb) followCb.checked = Boolean(draft.flags.followUpLater)
          setFollowUp?.(Boolean(draft.flags.followUpLater))
        }
        setFirst(draft.values?.firstName ?? "")
        setLast(draft.values?.lastName ?? "")
        const parseScore = (value?: string) => {
          if (!value) return undefined
          const parsed = Number(value)
          if (!Number.isFinite(parsed)) return undefined
          return parsed
        }
        const op = parseScore(draft.values?.confidenceOperating)
        const funding = parseScore(draft.values?.confidenceFunding)
        const funders = parseScore(draft.values?.confidenceFunders)
        if (typeof op === "number") setOperatingScore?.(op)
        if (typeof funding === "number") setFundingScore?.(funding)
        if (typeof funders === "number") setFundersScore?.(funders)
      }
    } catch {
      // ignore
    }
  }, [
    formRef,
    maxStep,
    setAvatarPreview,
    setFirst,
    setFundingScore,
    setFundersScore,
    setLast,
    setOperatingScore,
    setStep,
    setFollowUp,
  ])
}
