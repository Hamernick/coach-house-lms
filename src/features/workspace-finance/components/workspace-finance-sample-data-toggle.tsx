"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function WorkspaceFinanceSampleDataToggle({
  checked,
  onCheckedChange,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Label
      htmlFor="workspace-finance-sample-data"
      className="text-muted-foreground gap-2 text-xs font-normal"
    >
      <span className="sm:hidden">Sample</span>
      <span className="hidden sm:inline">Sample data</span>
      <Switch
        id="workspace-finance-sample-data"
        aria-label="Show sample Finance data"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </Label>
  )
}
