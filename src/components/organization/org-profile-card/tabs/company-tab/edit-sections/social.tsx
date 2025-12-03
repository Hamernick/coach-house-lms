"use client"

import { PROVIDER_ICON } from "@/components/shared/provider-icons"

import { FormRow, ProfileField, InputWithIcon } from "@/components/organization/org-profile-card/shared"
import type { CompanyEditProps } from "../types"

export function SocialSection({ company, errors, onInputChange }: CompanyEditProps) {
  const errorRecord = errors as Record<string, string>

  return (
    <FormRow title="Socials" description="Share how supporters can follow you.">
      <div className="grid gap-4 md:grid-cols-2">
        <ProfileField label="Twitter / X">
          <InputWithIcon
            icon={PROVIDER_ICON.link}
            inputProps={{
              name: "twitter",
              value: company.twitter ?? "",
              onChange: onInputChange,
              "aria-invalid": Boolean(errors.twitter),
              placeholder: "https://x.com/yourhandle",
            }}
          />
          {errors.twitter ? <p className="text-xs text-destructive">{errors.twitter}</p> : null}
        </ProfileField>
        <ProfileField label="Facebook">
          <InputWithIcon
            icon={PROVIDER_ICON.facebook}
            inputProps={{
              name: "facebook",
              value: company.facebook ?? "",
              onChange: onInputChange,
              "aria-invalid": Boolean(errors.facebook),
              placeholder: "https://facebook.com/yourpage",
            }}
          />
          {errors.facebook ? <p className="text-xs text-destructive">{errors.facebook}</p> : null}
        </ProfileField>
        <ProfileField label="LinkedIn">
          <InputWithIcon
            icon={PROVIDER_ICON.linkedin}
            inputProps={{
              name: "linkedin",
              value: company.linkedin ?? "",
              onChange: onInputChange,
              "aria-invalid": Boolean(errors.linkedin),
              placeholder: "https://linkedin.com/company/yourorg",
            }}
          />
          {errors.linkedin ? <p className="text-xs text-destructive">{errors.linkedin}</p> : null}
        </ProfileField>
        <ProfileField label="Instagram">
          <InputWithIcon
            icon={PROVIDER_ICON.instagram}
            inputProps={{
              name: "instagram",
              value: company.instagram ?? "",
              onChange: onInputChange,
              "aria-invalid": Boolean(errorRecord.instagram),
              placeholder: "https://instagram.com/yourorg",
            }}
          />
          {errorRecord.instagram ? <p className="text-xs text-destructive">{errorRecord.instagram}</p> : null}
        </ProfileField>
        <ProfileField label="YouTube">
          <InputWithIcon
            icon={PROVIDER_ICON.youtube}
            inputProps={{
              name: "youtube",
              value: company.youtube ?? "",
              onChange: onInputChange,
              "aria-invalid": Boolean(errorRecord.youtube),
              placeholder: "https://youtube.com/@yourorg",
            }}
          />
          {errorRecord.youtube ? <p className="text-xs text-destructive">{errorRecord.youtube}</p> : null}
        </ProfileField>
        <ProfileField label="TikTok">
          <InputWithIcon
            icon={PROVIDER_ICON.link}
            inputProps={{
              name: "tiktok",
              value: company.tiktok ?? "",
              onChange: onInputChange,
              "aria-invalid": Boolean(errorRecord.tiktok),
              placeholder: "https://tiktok.com/@yourorg",
            }}
          />
          {errorRecord.tiktok ? <p className="text-xs text-destructive">{errorRecord.tiktok}</p> : null}
        </ProfileField>
        <ProfileField label="GitHub">
          <InputWithIcon
            icon={PROVIDER_ICON.github}
            inputProps={{
              name: "github",
              value: company.github ?? "",
              onChange: onInputChange,
              "aria-invalid": Boolean(errorRecord.github),
              placeholder: "https://github.com/yourorg",
            }}
          />
          {errorRecord.github ? <p className="text-xs text-destructive">{errorRecord.github}</p> : null}
        </ProfileField>
      </div>
    </FormRow>
  )
}
