"use client"

import { useMemo, useState } from "react"
import { useFormStatus } from "react-dom"

import BellIcon from "lucide-react/dist/esm/icons/bell"
import Building2Icon from "lucide-react/dist/esm/icons/building-2"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import HeartIcon from "lucide-react/dist/esm/icons/heart"
import MapPinnedIcon from "lucide-react/dist/esm/icons/map-pinned"
import PanelRightOpenIcon from "lucide-react/dist/esm/icons/panel-right-open"
import SearchIcon from "lucide-react/dist/esm/icons/search"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type MemberMapOnboardingIntent = "find" | "fund" | "support"

type MemberMapOnboardingStep = {
  id: "map" | "search" | "save" | "notifications" | "organizations"
  title: string
  body: string
}

export function buildPublicMapMemberOnboardingSteps({
  hasOrganizationSwitcher,
}: {
  hasOrganizationSwitcher: boolean
}): MemberMapOnboardingStep[] {
  return [
    {
      id: "map",
      title: "Resource map",
      body: "Start here for public organizations, programs, and local resources as the directory grows.",
    },
    {
      id: "search",
      title: "Search the right rail",
      body: "Use the right rail to search by organization, location, program, or focus area without leaving the map.",
    },
    {
      id: "save",
      title: "Save resources",
      body: "Save organizations to keep a short list of useful resources and return to them later.",
    },
    {
      id: "notifications",
      title: "Notifications",
      body: "Notifications stay in the top bar for access requests, invites, and account updates.",
    },
    ...(hasOrganizationSwitcher
      ? [
          {
            id: "organizations" as const,
            title: "Switch organizations",
            body: "If you are invited to an organization, use the switcher in the sidebar header to move into that workspace.",
          },
        ]
      : []),
  ]
}

function StepVisual({ stepId }: { stepId: MemberMapOnboardingStep["id"] }) {
  if (stepId === "search") {
    return (
      <div className="w-full max-w-[18rem] rounded-[28px] border border-border/70 bg-background/82 p-3 shadow-sm">
        <div className="flex h-10 items-center gap-2 rounded-full border border-border/70 bg-muted/45 px-3">
          <SearchIcon className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-sm text-muted-foreground">Search resources</span>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {["Community kitchen", "Youth studio", "Housing support"].map((label) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-2xl border border-border/55 bg-card/80 px-3 py-2"
            >
              <span className="truncate text-sm font-medium text-foreground">{label}</span>
              <span className="size-2 rounded-full bg-foreground/18" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (stepId === "save") {
    return (
      <div className="grid w-full max-w-[18rem] gap-3">
        <div className="rounded-[26px] border border-border/70 bg-card/88 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">Atlas Collective</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                Neighborhood programs and mutual-aid resources.
              </p>
            </div>
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background">
              <HeartIcon className="size-4 fill-current" aria-hidden />
            </div>
          </div>
        </div>
        <div className="rounded-[24px] border border-border/60 bg-background/78 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <HeartIcon className="size-4 fill-current" aria-hidden />
            <span>Saved organizations</span>
            <span className="ml-auto rounded-full border border-border/70 px-2 py-0.5 text-xs text-muted-foreground">
              1
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (stepId === "notifications") {
    return (
      <div className="w-full max-w-[18rem] rounded-[28px] border border-border/70 bg-background/84 p-3 shadow-sm">
        <div className="flex items-center justify-end gap-2 border-b border-border/55 pb-3">
          <div className="grid size-9 place-items-center rounded-full border border-border/70 bg-card">
            <BellIcon className="size-4 text-foreground" aria-hidden />
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-3">
          <div className="rounded-2xl border border-border/60 bg-card/82 p-3">
            <p className="text-sm font-medium text-foreground">Access request</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Review invites and updates from one place.
            </p>
          </div>
          <div className="h-12 rounded-2xl border border-dashed border-border/70 bg-muted/25" />
        </div>
      </div>
    )
  }

  if (stepId === "organizations") {
    return (
      <div className="w-full max-w-[18rem] rounded-[28px] border border-border/70 bg-background/84 p-3 shadow-sm">
        <div className="flex items-center gap-3 rounded-2xl border border-border/65 bg-card/85 p-3">
          <div className="grid size-10 place-items-center rounded-xl bg-foreground text-background">
            <Building2Icon className="size-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">Current organization</p>
            <p className="truncate text-xs text-muted-foreground">2 organizations</p>
          </div>
          <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden />
        </div>
        <div className="mt-3 rounded-2xl border border-border/60 bg-card/70 p-2">
          {["Coach House", "Partner workspace"].map((label, index) => (
            <div key={label} className="flex items-center gap-2 rounded-xl px-2 py-2">
              <span className="size-7 rounded-lg bg-muted" />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                {label}
              </span>
              {index === 0 ? <CheckIcon className="size-4 text-foreground" aria-hidden /> : null}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative grid size-44 place-items-center rounded-[36px] border border-border/70 bg-background/82 shadow-sm">
      <div className="absolute left-7 top-7 size-5 rounded-full bg-foreground/15" />
      <div className="absolute bottom-8 right-8 size-7 rounded-full bg-foreground/20" />
      <div className="absolute right-10 top-10 size-4 rounded-full bg-foreground/12" />
      <div className="grid size-20 place-items-center rounded-[28px] bg-foreground text-background shadow-sm">
        <MapPinnedIcon className="size-9" aria-hidden />
      </div>
      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/70 bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground">
        <PanelRightOpenIcon className="size-3.5" aria-hidden />
        <span>Find</span>
      </div>
    </div>
  )
}

function OnboardingSubmitButton({
  isLastStep,
  onContinue,
  onFinish,
}: {
  isLastStep: boolean
  onContinue: () => void
  onFinish?: () => void
}) {
  const { pending } = useFormStatus()

  if (!isLastStep) {
    return (
      <Button type="button" className="rounded-full px-4" onClick={onContinue}>
        Continue
        <ChevronRightIcon data-icon="inline-end" aria-hidden />
      </Button>
    )
  }

  return (
    <Button
      type={onFinish ? "button" : "submit"}
      className="rounded-full px-4"
      disabled={pending}
      onClick={onFinish}
    >
      {pending ? "Finishing…" : "Start exploring"}
      <CheckIcon data-icon="inline-end" aria-hidden />
    </Button>
  )
}

type PublicMapMemberOnboardingOverlayBaseProps = {
  intentFocus?: MemberMapOnboardingIntent | null
  hasOrganizationSwitcher: boolean
}

export type PublicMapMemberOnboardingOverlayProps = PublicMapMemberOnboardingOverlayBaseProps & {
  onSubmit: (form: FormData) => Promise<void>
  onDismiss?: never
} | PublicMapMemberOnboardingOverlayBaseProps & {
  onSubmit?: never
  onDismiss: () => void
}

export function PublicMapMemberOnboardingOverlay({
  intentFocus = "find",
  hasOrganizationSwitcher,
  onSubmit,
  onDismiss,
}: PublicMapMemberOnboardingOverlayProps) {
  const steps = useMemo(
    () => buildPublicMapMemberOnboardingSteps({ hasOrganizationSwitcher }),
    [hasOrganizationSwitcher],
  )
  const [stepIndex, setStepIndex] = useState(0)
  const boundedStepIndex = Math.max(0, Math.min(stepIndex, steps.length - 1))
  const currentStep = steps[boundedStepIndex] ?? steps[0]
  const isLastStep = boundedStepIndex === steps.length - 1
  const resolvedIntentFocus =
    intentFocus === "fund" || intentFocus === "support" ? intentFocus : "find"
  const actionControls = (
    <>
      {onSubmit ? <input type="hidden" name="intentFocus" value={resolvedIntentFocus} /> : null}
      <Button
        type={onSubmit ? "submit" : "button"}
        variant="ghost"
        className="rounded-full px-3 text-muted-foreground"
        onClick={onDismiss}
      >
        Skip
      </Button>
      <OnboardingSubmitButton
        isLastStep={isLastStep}
        onContinue={() => setStepIndex((value) => Math.min(value + 1, steps.length - 1))}
        onFinish={onDismiss}
      />
    </>
  )

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center px-4 py-5 sm:items-center sm:p-6">
      <Card
        role="dialog"
        aria-modal="false"
        aria-labelledby="member-map-onboarding-title"
        aria-describedby="member-map-onboarding-description"
        className="pointer-events-auto h-[min(42rem,calc(100%-1rem))] w-full max-w-[34rem] overflow-hidden rounded-[30px] border-border/70 bg-background/88 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.58)] backdrop-blur-xl"
      >
        <CardContent className="flex min-h-0 flex-1 items-center justify-center px-6 pb-4 pt-6 sm:px-8 sm:pt-8">
          <StepVisual stepId={currentStep.id} />
        </CardContent>
        <CardFooter className="min-h-[14rem] flex-col items-stretch gap-4 border-t border-border/60 bg-background/92 px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
          <div className="flex items-center justify-center gap-1" aria-hidden>
            {steps.map((step, index) => (
              <span
                key={step.id}
                className={cn(
                  "h-1.5 rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none",
                  index === boundedStepIndex
                    ? "w-6 bg-foreground"
                    : "w-1.5 bg-muted-foreground/28",
                )}
              />
            ))}
          </div>
          <div className="text-center" aria-live="polite">
            <p
              id="member-map-onboarding-title"
              className="text-xl font-semibold tracking-tight text-foreground"
            >
              {currentStep.title}
            </p>
            <p
              id="member-map-onboarding-description"
              className="mx-auto mt-2 max-w-[26rem] text-sm leading-6 text-muted-foreground"
            >
              {currentStep.body}
            </p>
          </div>
          {onSubmit ? (
            <form action={onSubmit} className="mt-auto flex items-center justify-between gap-3">
              {actionControls}
            </form>
          ) : (
            <div className="mt-auto flex items-center justify-between gap-3">
              {actionControls}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
