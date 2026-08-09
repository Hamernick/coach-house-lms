"use client"

import type * as React from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  FISCAL_SPONSORSHIP_FORM_B_FIELDS,
  type FiscalSponsorshipFormBFieldKey,
  type FiscalSponsorshipFormBFields,
} from "../../lib/form-b-field-manifest"

const SYSTEM_FIELDS = new Set<FiscalSponsorshipFormBFieldKey>([
  "projectId",
  "applicationDate",
])

export function FiscalSponsorshipFormBFieldGrid({
  editable,
  fields,
  onChange,
}: {
  editable: boolean
  fields: FiscalSponsorshipFormBFields
  onChange: (key: FiscalSponsorshipFormBFieldKey, value: string) => void
}) {
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      {FISCAL_SPONSORSHIP_FORM_B_FIELDS.map((field) => {
        const id = `form-b-${field.key}`
        const isWide = [
          "applicantFullName",
          "mailingStreetAddress",
          "mailingStreetAddress2",
          "primaryEmail",
          "legalEntityName",
          "legalEntityType",
          "projectName",
        ].includes(field.key)
        const disabled = !editable || SYSTEM_FIELDS.has(field.key)
        const optional = "optional" in field && field.optional
        const type = "type" in field ? field.type : "text"
        return (
          <div
            key={field.key}
            className={cn("space-y-2", isWide && "sm:col-span-2")}
          >
            <Label htmlFor={id}>{field.label}</Label>
            <Input
              id={id}
              name={field.key}
              type={type}
              value={fields[field.key]}
              maxLength={field.maxLength}
              disabled={disabled}
              required={!optional}
              autoComplete={
                field.key === "primaryEmail"
                  ? "email"
                  : field.key === "phoneNumber"
                    ? "tel"
                    : undefined
              }
              onChange={(event) => onChange(field.key, event.target.value)}
            />
          </div>
        )
      })}
    </div>
  )
}

function SigningCheckbox({
  checked,
  children,
  disabled,
  id,
  onCheckedChange,
}: {
  checked: boolean
  children: React.ReactNode
  disabled?: boolean
  id: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      <Label
        htmlFor={id}
        className="text-muted-foreground block text-sm leading-5 font-normal"
      >
        {children}
      </Label>
    </div>
  )
}

export function FiscalSponsorshipSigningConsentFields({
  authorized,
  confirmed,
  consented,
  disabled,
  onAuthorizedChange,
  onConfirmedChange,
  onConsentedChange,
}: {
  authorized: boolean
  confirmed: boolean
  consented: boolean
  disabled: boolean
  onAuthorizedChange: (checked: boolean) => void
  onConfirmedChange: (checked: boolean) => void
  onConsentedChange: (checked: boolean) => void
}) {
  return (
    <div className="mt-6 space-y-4">
      <SigningCheckbox
        id="confirm-fields"
        checked={confirmed}
        disabled={disabled}
        onCheckedChange={onConfirmedChange}
      >
        I reviewed the complete agreement and confirm the displayed information
        is correct.
      </SigningCheckbox>
      <SigningCheckbox
        id="electronic-consent"
        checked={consented}
        disabled={disabled}
        onCheckedChange={onConsentedChange}
      >
        I consent to electronic records and signatures for this agreement.
      </SigningCheckbox>
      <SigningCheckbox
        id="signing-authority"
        checked={authorized}
        disabled={disabled}
        onCheckedChange={onAuthorizedChange}
      >
        I am authorized to sign for the named party.
      </SigningCheckbox>
    </div>
  )
}
