"use client"

import { PROVIDER_ICON } from "@/components/shared/provider-icons"

import { FormRow, ProfileField, InputWithIcon } from "@/components/organization/org-profile-card/shared"
import type { CompanyEditProps } from "../types"

export function PresenceSection({ company, errors, onInputChange }: CompanyEditProps) {
  return (
    <FormRow title="Presence" description="Primary website and newsletter.">
      <div className="grid gap-4 md:grid-cols-2">
        <ProfileField label="Website">
          <InputWithIcon
            icon={PROVIDER_ICON.generic}
            inputProps={{
              name: "publicUrl",
              value: company.publicUrl ?? "",
              onChange: onInputChange,
              "aria-invalid": Boolean(errors.publicUrl),
              placeholder: "google.com",
            }}
          />
          {errors.publicUrl ? <p className="text-xs text-destructive">{errors.publicUrl}</p> : null}
          <p className="text-xs text-muted-foreground">
            Your organization&apos;s own website (not your Coach House public page URL).
          </p>
        </ProfileField>
        <ProfileField label="Newsletter">
          <InputWithIcon
            icon={PROVIDER_ICON.link}
            inputProps={{
              name: "newsletter",
              value: company.newsletter ?? "",
              onChange: onInputChange,
              "aria-invalid": Boolean((errors as Record<string, string>).newsletter),
              placeholder: "newsletter.example.org",
            }}
          />
          {(errors as Record<string, string>).newsletter ? (
            <p className="text-xs text-destructive">{(errors as Record<string, string>).newsletter}</p>
          ) : null}
        </ProfileField>
      </div>
    </FormRow>
  )
}
