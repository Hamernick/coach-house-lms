"use client"

import CheckIcon from "lucide-react/dist/esm/icons/check"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { OrganizationFormationStatusSummary } from "@/components/organization/organization-formation-status-summary"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { FORMATION_OPTIONS } from "../constants"
import type { FormationStatus } from "../types"

type OrganizationStepProps = {
  step: number
  attemptedStep: number | null
  errors: Record<string, string>
  initialOrgName: string
  initialOrgSlug: string
  slugStatus: "idle" | "checking" | "available" | "unavailable"
  slugHint: string | null
  formationStatus: FormationStatus | ""
  onOrgNameChange: (value: string) => void
  onOrgSlugChange: (value: string) => string
  onFormationStatusSelect: (value: FormationStatus) => void
}

export function OrganizationStep({
  step,
  attemptedStep,
  errors,
  initialOrgName,
  initialOrgSlug,
  slugStatus,
  slugHint,
  formationStatus,
  onOrgNameChange,
  onOrgSlugChange,
  onFormationStatusSelect,
}: OrganizationStepProps) {
  return (
    <div className="space-y-5 py-5" data-onboarding-step-id="org">
      <div className="grid gap-2">
        <Label htmlFor="orgName">Organization name</Label>
        <Input
          id="orgName"
          name="orgName"
          data-onboarding-primary-focus="true"
          placeholder="Acme Inc."
          defaultValue={initialOrgName}
          aria-invalid={attemptedStep === step && Boolean(errors.orgName)}
          onChange={(event) => {
            onOrgNameChange(event.currentTarget.value)
          }}
        />
        <p className="text-muted-foreground text-xs">
          Display name and public URL are separate. You can keep this name and
          change the URL if needed.
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
              const normalized = onOrgSlugChange(event.currentTarget.value)
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
        <ToggleGroupPrimitive.Root
          type="single"
          value={formationStatus || undefined}
          onValueChange={(value) => {
            if (!value) return
            onFormationStatusSelect(value as FormationStatus)
          }}
          aria-label="Formation status"
          data-slot="toggle-group"
          className="box-border grid min-w-0 w-full max-w-full items-stretch gap-2 sm:grid-cols-3"
        >
          {FORMATION_OPTIONS.map((option) => {
            const selected = formationStatus === option.value
            return (
              <ToggleGroupPrimitive.Item
                key={option.value}
                value={option.value}
                data-slot="toggle-group-item"
                className={cn(
                  "flex h-full w-full min-w-0 items-stretch justify-start rounded-2xl border p-0 text-left whitespace-normal shadow-none outline-none transition-colors",
                  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
                  "data-[state=on]:border-primary/60 data-[state=on]:bg-primary/5 data-[state=on]:text-foreground",
                  selected
                    ? "border-primary/60 bg-primary/5"
                    : "border-border/70 bg-background/60 text-foreground hover:bg-background",
                )}
              >
                <OrganizationFormationStatusSummary
                  formationStatus={option}
                  contained={false}
                  className="flex h-full w-full min-w-0 flex-col gap-2 rounded-2xl p-3 text-left"
                />
              </ToggleGroupPrimitive.Item>
            )
          })}
        </ToggleGroupPrimitive.Root>
        {attemptedStep === step && errors.formationStatus ? (
          <p className="text-destructive text-xs">{errors.formationStatus}</p>
        ) : null}
      </div>
    </div>
  )
}
