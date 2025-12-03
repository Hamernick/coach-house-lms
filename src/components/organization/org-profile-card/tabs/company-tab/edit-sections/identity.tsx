"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { FormRow, ProfileField } from "@/components/organization/org-profile-card/shared"
import type { CompanyEditProps } from "../types"

export function IdentitySection({ company, errors, onInputChange }: CompanyEditProps) {
  return (
    <FormRow title="Identity" description="Basic details that represent your organization.">
      <div className="grid gap-4 md:grid-cols-2">
        <ProfileField label="Organization name">
          <Input name="name" value={company.name ?? ""} onChange={onInputChange} aria-invalid={Boolean(errors.name)} />
          {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
        </ProfileField>
        <ProfileField label="Tag line">
          <Input name="tagline" value={company.tagline ?? ""} onChange={onInputChange} aria-invalid={Boolean(errors.tagline)} />
          {errors.tagline ? <p className="text-xs text-destructive">{errors.tagline}</p> : null}
        </ProfileField>
        <ProfileField label="Description">
          <Textarea name="description" value={company.description ?? ""} onChange={onInputChange} rows={3} aria-invalid={Boolean(errors.description)} />
          {errors.description ? <p className="text-xs text-destructive">{errors.description}</p> : null}
        </ProfileField>
        <ProfileField label="EIN">
          <Input name="ein" value={company.ein ?? ""} onChange={onInputChange} aria-invalid={Boolean(errors.ein)} />
          {errors.ein ? <p className="text-xs text-destructive">{errors.ein}</p> : null}
          <p className="text-xs text-muted-foreground">Format: 12-3456789</p>
        </ProfileField>
      </div>
    </FormRow>
  )
}
