"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FISCAL_SPONSORSHIP_W9_CLASSIFICATION_OPTIONS,
  type FiscalSponsorshipW9Fields,
  type FiscalSponsorshipW9TaxClassification,
} from "../../lib/w9-field-manifest"
import {
  W9FieldError,
  W9FieldShell,
  type W9FieldErrors,
} from "./fiscal-sponsorship-w9-field-support"

export { FiscalSponsorshipW9AddressAndTinFields } from "./fiscal-sponsorship-w9-address-tin-fields"

export function FiscalSponsorshipW9IdentityFields({
  errors,
  fields,
  onChange,
}: {
  errors: W9FieldErrors
  fields: FiscalSponsorshipW9Fields
  onChange: <Key extends keyof FiscalSponsorshipW9Fields>(
    key: Key,
    value: FiscalSponsorshipW9Fields[Key]
  ) => void
}) {
  const classificationErrorId = "w9-taxClassification-error"

  return (
    <section aria-labelledby="w9-identity-heading" className="space-y-4">
      <div>
        <h2
          id="w9-identity-heading"
          className="text-lg font-semibold text-balance"
        >
          Taxpayer identity
        </h2>
        <p className="text-muted-foreground mt-1 text-sm text-pretty">
          Match the name and classification used on the federal tax return.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <W9FieldShell className="sm:col-span-2">
          <Label htmlFor="w9-name">Name of individual or entity</Label>
          <Input
            id="w9-name"
            name="name"
            value={fields.name}
            maxLength={120}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "w9-name-error" : undefined}
            onChange={(event) => onChange("name", event.target.value)}
          />
          <W9FieldError id="w9-name-error" error={errors.name} />
        </W9FieldShell>

        <W9FieldShell className="sm:col-span-2">
          <Label htmlFor="w9-businessName">
            Business or disregarded entity name
          </Label>
          <Input
            id="w9-businessName"
            name="businessName"
            value={fields.businessName}
            maxLength={120}
            autoComplete="organization"
            onChange={(event) => onChange("businessName", event.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            Optional when different from the name above.
          </p>
        </W9FieldShell>
      </div>

      <fieldset
        aria-describedby={
          errors.taxClassification ? classificationErrorId : undefined
        }
      >
        <legend className="text-sm font-medium">
          Federal tax classification
        </legend>
        <RadioGroup
          value={fields.taxClassification}
          onValueChange={(value) =>
            onChange(
              "taxClassification",
              value as FiscalSponsorshipW9TaxClassification
            )
          }
          className="mt-2 grid gap-2 sm:grid-cols-2"
        >
          {FISCAL_SPONSORSHIP_W9_CLASSIFICATION_OPTIONS.map((option) => (
            <Label
              key={option.value}
              htmlFor={`w9-classification-${option.value}`}
              className="border-border hover:bg-muted/50 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 font-normal"
            >
              <RadioGroupItem
                id={`w9-classification-${option.value}`}
                value={option.value}
              />
              <span className="text-sm">{option.label}</span>
            </Label>
          ))}
        </RadioGroup>
        <W9FieldError
          id={classificationErrorId}
          error={errors.taxClassification}
        />
      </fieldset>

      {fields.taxClassification === "llc" ? (
        <W9FieldShell>
          <Label htmlFor="w9-llc-classification">LLC tax classification</Label>
          <Select
            value={fields.llcClassification}
            onValueChange={(value) =>
              onChange(
                "llcClassification",
                value as FiscalSponsorshipW9Fields["llcClassification"]
              )
            }
          >
            <SelectTrigger
              id="w9-llc-classification"
              aria-invalid={Boolean(errors.llcClassification)}
              aria-describedby={
                errors.llcClassification
                  ? "w9-llc-classification-error"
                  : undefined
              }
            >
              <SelectValue placeholder="Choose C, S, or P…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="C">C corporation</SelectItem>
              <SelectItem value="S">S corporation</SelectItem>
              <SelectItem value="P">Partnership</SelectItem>
            </SelectContent>
          </Select>
          <W9FieldError
            id="w9-llc-classification-error"
            error={errors.llcClassification}
          />
        </W9FieldShell>
      ) : null}

      {fields.taxClassification === "other" ? (
        <W9FieldShell>
          <Label htmlFor="w9-other-classification">Other classification</Label>
          <Input
            id="w9-other-classification"
            name="otherClassification"
            value={fields.otherClassification}
            maxLength={80}
            aria-invalid={Boolean(errors.otherClassification)}
            aria-describedby={
              errors.otherClassification
                ? "w9-other-classification-error"
                : undefined
            }
            onChange={(event) =>
              onChange("otherClassification", event.target.value)
            }
          />
          <W9FieldError
            id="w9-other-classification-error"
            error={errors.otherClassification}
          />
        </W9FieldShell>
      ) : null}

      {["partnership", "trust_estate"].includes(fields.taxClassification) ||
      (fields.taxClassification === "llc" &&
        fields.llcClassification === "P") ? (
        <Label
          htmlFor="w9-foreign-partners"
          className="flex cursor-pointer items-start gap-3 font-normal"
        >
          <Checkbox
            id="w9-foreign-partners"
            checked={fields.foreignPartnersOwnersBeneficiaries}
            className="mt-0.5"
            onCheckedChange={(checked) =>
              onChange("foreignPartnersOwnersBeneficiaries", checked === true)
            }
          />
          <span className="text-muted-foreground text-sm leading-5 text-pretty">
            This flow-through entity has direct or indirect foreign partners,
            owners, or beneficiaries.
          </span>
        </Label>
      ) : null}
    </section>
  )
}
