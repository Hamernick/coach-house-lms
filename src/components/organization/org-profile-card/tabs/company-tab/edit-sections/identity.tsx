"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { FormRow, ProfileField } from "@/components/organization/org-profile-card/shared"
import type { CompanyEditProps } from "../types"

export function IdentitySection({ company, errors, onInputChange, onUpdate, onDirty }: CompanyEditProps) {
  return (
    <FormRow title="Identity" description="Basic details that represent your organization.">
      <div className="grid gap-4 md:grid-cols-2">
        <ProfileField label="Organization name">
          <Input
            name="name"
            value={company.name ?? ""}
            onChange={onInputChange}
            aria-invalid={Boolean(errors.name)}
            placeholder="Bright Futures Initiative"
          />
          {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
        </ProfileField>
        <ProfileField label="Tag line">
          <Input
            name="tagline"
            value={company.tagline ?? ""}
            onChange={onInputChange}
            aria-invalid={Boolean(errors.tagline)}
            placeholder="Powering opportunity for youth"
          />
          {errors.tagline ? <p className="text-xs text-destructive">{errors.tagline}</p> : null}
        </ProfileField>
        <ProfileField label="Description">
          <Textarea
            name="description"
            value={company.description ?? ""}
            onChange={onInputChange}
            rows={3}
            aria-invalid={Boolean(errors.description)}
            placeholder="We partner with schools to deliver after-school STEM labs and mentorship for middle school students."
          />
          {errors.description ? <p className="text-xs text-destructive">{errors.description}</p> : null}
        </ProfileField>
        <ProfileField label="EIN">
          <Input
            name="ein"
            value={company.ein ?? ""}
            onChange={onInputChange}
            aria-invalid={Boolean(errors.ein)}
            placeholder="12-3456789"
          />
          {errors.ein ? <p className="text-xs text-destructive">{errors.ein}</p> : null}
          <p className="text-xs text-muted-foreground">Format: 12-3456789</p>
        </ProfileField>
        <ProfileField label="Formation status">
          <Select
            value={company.formationStatus || "in_progress"}
            onValueChange={(value) => {
              if (value !== "pre_501c3" && value !== "in_progress" && value !== "approved") return
              onUpdate({ formationStatus: value })
              onDirty()
            }}
          >
            <SelectTrigger data-tour="org-formation-status" className="bg-background">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pre_501c3">Pre-501(c)(3)</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Used to tailor your formation checklist and map listing steps.</p>
        </ProfileField>
      </div>
    </FormRow>
  )
}
