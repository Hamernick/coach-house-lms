import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AccountSettingsErrorKey } from "../../types"
import { OrganizationStageSelect } from "../section-helpers"

export type OrganizationSectionProps = {
  orgName: string
  orgDesc: string
  website: string
  social: string
  applyingAs: "individual" | "organization" | ""
  stage: string
  problem: string
  mission: string
  goals: string
  errors: Partial<Record<AccountSettingsErrorKey, string>>
  onOrgNameChange: (value: string) => void
  onOrgDescChange: (value: string) => void
  onWebsiteChange: (value: string) => void
  onSocialChange: (value: string) => void
  onApplyingAsChange: (value: "individual" | "organization") => void
  onStageChange: (value: string) => void
  onProblemChange: (value: string) => void
  onMissionChange: (value: string) => void
  onGoalsChange: (value: string) => void
}

export function OrganizationSection({
  orgName,
  orgDesc,
  website,
  social,
  applyingAs,
  stage,
  problem,
  mission,
  goals,
  errors,
  onOrgNameChange,
  onOrgDescChange,
  onWebsiteChange,
  onSocialChange,
  onApplyingAsChange,
  onStageChange,
  onProblemChange,
  onMissionChange,
  onGoalsChange,
}: OrganizationSectionProps) {
  return (
    <div className="space-y-6">
      <header>
        <h3 className="text-lg font-semibold">Organization</h3>
        <p className="text-sm text-muted-foreground">Tell us about your work.</p>
      </header>
      <div className="grid max-w-xl gap-4">
        <div className="grid gap-2">
          <Label htmlFor="orgName">Organization/Project Name</Label>
          <Input id="orgName" value={orgName} aria-invalid={Boolean(errors?.orgName)} onChange={(event) => onOrgNameChange(event.currentTarget.value)} />
          {errors?.orgName ? <p className="text-xs text-destructive">{errors.orgName}</p> : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="orgDesc">Description</Label>
          <textarea
            id="orgDesc"
            placeholder="Tell us about what you're building"
            className="min-h-24 w-full rounded-md border bg-transparent p-2 text-sm"
            value={orgDesc}
            onChange={(event) => onOrgDescChange(event.currentTarget.value)}
          />
          {errors?.orgDesc ? <p className="text-xs text-destructive">{errors.orgDesc}</p> : null}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">http://</span>
              <Input id="website" className="flex-1" placeholder="example.com" value={website} onChange={(event) => onWebsiteChange(event.currentTarget.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="social">Social username</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">@</span>
              <Input id="social" className="flex-1" placeholder="yourhandle" value={social} onChange={(event) => onSocialChange(event.currentTarget.value)} />
            </div>
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Applying as</Label>
          <div className="mt-1 flex gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="radio" name="applyingAs" value="individual" checked={applyingAs === "individual"} onChange={() => onApplyingAsChange("individual")} className="h-4 w-4" />
              Individual
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="radio" name="applyingAs" value="organization" checked={applyingAs === "organization"} onChange={() => onApplyingAsChange("organization")} className="h-4 w-4" />
              Organization
            </label>
          </div>
          {errors?.applyingAs ? <p className="text-xs text-destructive">{errors.applyingAs}</p> : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="stage">Stage</Label>
          <OrganizationStageSelect id="stage" value={stage} onChange={onStageChange} ariaInvalid={Boolean(errors?.stage)} />
          {errors?.stage ? <p className="text-xs text-destructive">{errors.stage}</p> : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="problem">Problem</Label>
          <textarea id="problem" className="min-h-24 w-full rounded-md border bg-transparent p-2 text-sm" aria-invalid={Boolean(errors?.problem)} value={problem} onChange={(event) => onProblemChange(event.currentTarget.value)} />
          {errors?.problem ? <p className="text-xs text-destructive">{errors.problem}</p> : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="mission">Mission</Label>
          <textarea id="mission" className="min-h-24 w-full rounded-md border bg-transparent p-2 text-sm" value={mission} onChange={(event) => onMissionChange(event.currentTarget.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="goals">Goals</Label>
          <textarea id="goals" className="min-h-24 w-full rounded-md border bg-transparent p-2 text-sm" value={goals} onChange={(event) => onGoalsChange(event.currentTarget.value)} />
        </div>
      </div>
    </div>
  )
}
