"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ProjectRecurrenceSelect({
  value,
  onChange,
  disabled,
}: {
  value: "none" | "monthly"
  onChange: (value: "none" | "monthly") => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <Select
        value={value}
        onValueChange={(next) => onChange(next as "none" | "monthly")}
        disabled={disabled}
      >
        <SelectTrigger
          aria-label="Project repeat schedule"
          className="w-full sm:w-56"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="none">Does Not Repeat</SelectItem>
            <SelectItem value="monthly">Repeat Monthly</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      {value === "monthly" ? (
        <p className="text-muted-foreground text-sm">
          Completing this project creates next month’s copy with fresh tasks.
          Completed months stay in your history. Choose Does Not Repeat to stop.
        </p>
      ) : null}
    </div>
  )
}
