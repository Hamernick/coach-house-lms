"use client"

import { useId } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function ProjectFiscalSponsorshipOption({ checked, onChange, disabled }: {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} disabled={disabled} />
      <div className="flex flex-col gap-1">
        <Label htmlFor={id}>Add Fiscal Sponsorship</Label>
        <p className="text-muted-foreground text-xs">Include the sponsorship application and documents. You can add this later.</p>
      </div>
    </div>
  )
}
