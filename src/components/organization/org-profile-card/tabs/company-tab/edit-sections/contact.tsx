"use client"

import { Input } from "@/components/ui/input"

import { FormRow, ProfileField } from "@/components/organization/org-profile-card/shared"
import type { CompanyEditProps } from "../types"

export function ContactSection({ company, errors, onInputChange }: CompanyEditProps) {
  return (
    <FormRow title="Contact" description="Primary point of contact and ways to reach you.">
      <div className="grid gap-4 md:grid-cols-2">
        <ProfileField label="Representative">
          <Input
            name="rep"
            value={company.rep ?? ""}
            onChange={onInputChange}
            aria-invalid={Boolean(errors.rep)}
            placeholder="Jordan Lee"
          />
          {errors.rep ? <p className="text-xs text-destructive">{errors.rep}</p> : null}
        </ProfileField>
        <ProfileField label="Email">
          <Input
            name="email"
            type="email"
            value={company.email ?? ""}
            onChange={onInputChange}
            aria-invalid={Boolean(errors.email)}
            placeholder="hello@brightfutures.org"
          />
          {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
        </ProfileField>
        <ProfileField label="Phone">
          <Input
            name="phone"
            value={company.phone ?? ""}
            onChange={onInputChange}
            aria-invalid={Boolean(errors.phone)}
            placeholder="(555) 123-4567"
          />
          {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
        </ProfileField>
      </div>
    </FormRow>
  )
}
