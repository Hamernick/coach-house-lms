"use client"

import EyeIcon from "lucide-react/dist/esm/icons/eye"
import EyeOffIcon from "lucide-react/dist/esm/icons/eye-off"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import type {
  FiscalSponsorshipW9Fields,
  FiscalSponsorshipW9TinType,
} from "../../lib/w9-field-manifest"
import {
  W9FieldError,
  W9FieldShell,
  type W9FieldErrors,
} from "./fiscal-sponsorship-w9-field-support"

export function FiscalSponsorshipW9AddressAndTinFields({
  errors,
  fields,
  onChange,
  showTin,
  onShowTinChange,
}: {
  errors: W9FieldErrors
  fields: FiscalSponsorshipW9Fields
  onChange: <Key extends keyof FiscalSponsorshipW9Fields>(
    key: Key,
    value: FiscalSponsorshipW9Fields[Key]
  ) => void
  showTin: boolean
  onShowTinChange: (show: boolean) => void
}) {
  return (
    <section aria-labelledby="w9-address-heading" className="space-y-4">
      <div>
        <h2
          id="w9-address-heading"
          className="text-lg font-semibold text-balance"
        >
          Address and taxpayer ID
        </h2>
        <p className="text-muted-foreground mt-1 text-sm text-pretty">
          The full TIN is written only into the secured PDF. Database metadata
          retains the last four digits.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-6">
        <W9FieldShell className="sm:col-span-6">
          <Label htmlFor="w9-address">Mailing address</Label>
          <Input
            id="w9-address"
            name="address"
            value={fields.address}
            maxLength={120}
            autoComplete="street-address"
            aria-invalid={Boolean(errors.address)}
            aria-describedby={errors.address ? "w9-address-error" : undefined}
            onChange={(event) => onChange("address", event.target.value)}
          />
          <W9FieldError id="w9-address-error" error={errors.address} />
        </W9FieldShell>
        <W9FieldShell className="sm:col-span-3">
          <Label htmlFor="w9-city">City</Label>
          <Input
            id="w9-city"
            name="city"
            value={fields.city}
            maxLength={80}
            autoComplete="address-level2"
            aria-invalid={Boolean(errors.city)}
            aria-describedby={errors.city ? "w9-city-error" : undefined}
            onChange={(event) => onChange("city", event.target.value)}
          />
          <W9FieldError id="w9-city-error" error={errors.city} />
        </W9FieldShell>
        <W9FieldShell className="sm:col-span-1">
          <Label htmlFor="w9-state">State</Label>
          <Input
            id="w9-state"
            name="state"
            value={fields.state}
            maxLength={40}
            autoComplete="address-level1"
            aria-invalid={Boolean(errors.state)}
            aria-describedby={errors.state ? "w9-state-error" : undefined}
            onChange={(event) => onChange("state", event.target.value)}
          />
          <W9FieldError id="w9-state-error" error={errors.state} />
        </W9FieldShell>
        <W9FieldShell className="sm:col-span-2">
          <Label htmlFor="w9-postalCode">ZIP code</Label>
          <Input
            id="w9-postalCode"
            name="postalCode"
            value={fields.postalCode}
            maxLength={20}
            inputMode="numeric"
            autoComplete="postal-code"
            aria-invalid={Boolean(errors.postalCode)}
            aria-describedby={
              errors.postalCode ? "w9-postalCode-error" : undefined
            }
            onChange={(event) => onChange("postalCode", event.target.value)}
          />
          <W9FieldError id="w9-postalCode-error" error={errors.postalCode} />
        </W9FieldShell>
        <W9FieldShell className="sm:col-span-3">
          <Label htmlFor="w9-exempt-payee">Exempt payee code</Label>
          <Input
            id="w9-exempt-payee"
            name="exemptPayeeCode"
            value={fields.exemptPayeeCode}
            maxLength={12}
            onChange={(event) =>
              onChange("exemptPayeeCode", event.target.value)
            }
          />
          <p className="text-muted-foreground text-xs">Optional.</p>
        </W9FieldShell>
        <W9FieldShell className="sm:col-span-3">
          <Label htmlFor="w9-fatca-code">FATCA exemption code</Label>
          <Input
            id="w9-fatca-code"
            name="fatcaExemptionCode"
            value={fields.fatcaExemptionCode}
            maxLength={12}
            onChange={(event) =>
              onChange("fatcaExemptionCode", event.target.value)
            }
          />
          <p className="text-muted-foreground text-xs">Optional.</p>
        </W9FieldShell>
        <W9FieldShell className="sm:col-span-6">
          <Label htmlFor="w9-account-number">Account number</Label>
          <Input
            id="w9-account-number"
            name="accountNumber"
            value={fields.accountNumber}
            maxLength={80}
            onChange={(event) => onChange("accountNumber", event.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            Coach House project reference. Optional on Form W-9.
          </p>
        </W9FieldShell>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Taxpayer ID type</legend>
        <RadioGroup
          value={fields.tinType}
          onValueChange={(value) =>
            onChange("tinType", value as FiscalSponsorshipW9TinType)
          }
          className="mt-2 grid grid-cols-2 gap-2"
        >
          {[
            { label: "SSN or ITIN", value: "ssn" },
            { label: "EIN", value: "ein" },
          ].map((option) => (
            <Label
              key={option.value}
              htmlFor={`w9-tin-type-${option.value}`}
              className="border-border hover:bg-muted/50 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 font-normal"
            >
              <RadioGroupItem
                id={`w9-tin-type-${option.value}`}
                value={option.value}
              />
              <span className="text-sm">{option.label}</span>
            </Label>
          ))}
        </RadioGroup>
      </fieldset>

      <W9FieldShell>
        <Label htmlFor="w9-tin">
          {fields.tinType === "ssn" ? "SSN or ITIN" : "EIN"}
        </Label>
        <div className="relative">
          <Input
            id="w9-tin"
            name="tin"
            type={showTin ? "text" : "password"}
            value={fields.tin}
            maxLength={24}
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            className="pr-11 font-mono tabular-nums"
            aria-invalid={Boolean(errors.tin)}
            aria-describedby={errors.tin ? "w9-tin-error" : "w9-tin-help"}
            onChange={(event) => onChange("tin", event.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
            aria-label={showTin ? "Hide taxpayer ID" : "Show taxpayer ID"}
            onClick={() => onShowTinChange(!showTin)}
          >
            {showTin ? <EyeOffIcon aria-hidden /> : <EyeIcon aria-hidden />}
          </Button>
        </div>
        <p id="w9-tin-help" className="text-muted-foreground text-xs">
          Nine digits. Spaces and hyphens are accepted.
        </p>
        <W9FieldError id="w9-tin-error" error={errors.tin} />
      </W9FieldShell>

      <Label
        htmlFor="w9-backup-withholding"
        className="flex cursor-pointer items-start gap-3 font-normal"
      >
        <Checkbox
          id="w9-backup-withholding"
          checked={fields.subjectToBackupWithholding}
          className="mt-0.5"
          onCheckedChange={(checked) =>
            onChange("subjectToBackupWithholding", checked === true)
          }
        />
        <span className="text-muted-foreground text-sm leading-5 text-pretty">
          The IRS notified me that I am currently subject to backup withholding.
          Selecting this crosses out certification item&nbsp;2 on the generated
          form.
        </span>
      </Label>
    </section>
  )
}
