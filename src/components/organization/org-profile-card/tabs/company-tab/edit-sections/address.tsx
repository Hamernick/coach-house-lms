"use client"

import { Input } from "@/components/ui/input"
import {
  Field as FieldRow,
  FieldDescription as FieldHelperText,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"

import { FormRow } from "@/components/organization/org-profile-card/shared"
import type { CompanyEditProps } from "../types"

export function AddressSection({ company, onInputChange }: CompanyEditProps) {
  return (
    <FormRow title="Address" description="Mailing address for invoices and communications.">
      <div className="grid gap-4">
        <FieldSet className="gap-4 rounded-lg border border-dashed p-4">
          <FieldLegend>Organization address</FieldLegend>
          <FieldHelperText>Provide a mailing address for invoices and communications.</FieldHelperText>
          <FieldGroup className="gap-4">
            <FieldRow>
              <FieldLabel htmlFor="addressStreet">Street address</FieldLabel>
              <Input id="addressStreet" name="addressStreet" value={company.addressStreet ?? ""} onChange={onInputChange} placeholder="123 Main St" />
            </FieldRow>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldRow>
                <FieldLabel htmlFor="addressCity">City</FieldLabel>
                <Input id="addressCity" name="addressCity" value={company.addressCity ?? ""} onChange={onInputChange} placeholder="New York" />
              </FieldRow>
              <FieldRow>
                <FieldLabel htmlFor="addressState">State / Region</FieldLabel>
                <Input id="addressState" name="addressState" value={company.addressState ?? ""} onChange={onInputChange} placeholder="NY" />
              </FieldRow>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldRow>
                <FieldLabel htmlFor="addressPostal">Postal code</FieldLabel>
                <Input id="addressPostal" name="addressPostal" value={company.addressPostal ?? ""} onChange={onInputChange} placeholder="10001" />
              </FieldRow>
              <FieldRow>
                <FieldLabel htmlFor="addressCountry">Country</FieldLabel>
                <Input id="addressCountry" name="addressCountry" value={company.addressCountry ?? ""} onChange={onInputChange} placeholder="United States" />
              </FieldRow>
            </div>
          </FieldGroup>
        </FieldSet>
      </div>
    </FormRow>
  )
}
