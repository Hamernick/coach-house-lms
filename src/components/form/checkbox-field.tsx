"use client"

import * as React from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

type Props = {
  id: string
  name: string
  label: string
  description?: string
  defaultChecked?: boolean
  className?: string
}

export function CheckboxField({ id, name, label, description, defaultChecked, className }: Props) {
  const [checked, setChecked] = React.useState<boolean>(Boolean(defaultChecked))

  return (
    <div className={"flex items-start gap-3 rounded-md border border-border/50 p-3 " + (className ?? "")}> 
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => setChecked(Boolean(v))} />
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {checked ? <input type="hidden" name={name} value="on" /> : null}
    </div>
  )
}

