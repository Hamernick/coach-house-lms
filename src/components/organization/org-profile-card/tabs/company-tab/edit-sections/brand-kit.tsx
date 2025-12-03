"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { FormRow, ProfileField } from "@/components/organization/org-profile-card/shared"
import type { CompanyEditProps } from "../types"

export function BrandKitSection({ company, errors, onInputChange }: CompanyEditProps) {
  return (
    <FormRow title="Brand Kit" description="Add your logo and boilerplate.">
      <div className="grid gap-6">
        <ProfileField label="Logo URL">
          <Input name="logoUrl" value={company.logoUrl ?? ""} onChange={onInputChange} aria-invalid={Boolean(errors.logoUrl)} />
          {errors.logoUrl ? <p className="text-xs text-destructive">{errors.logoUrl}</p> : null}
        </ProfileField>
        <ProfileField label="Boilerplate">
          <Textarea name="boilerplate" value={company.boilerplate ?? ""} onChange={onInputChange} rows={4} />
        </ProfileField>
      </div>
    </FormRow>
  )
}
