"use client"

import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DialogStackContent,
  DialogStackDescription,
  DialogStackFooter,
  DialogStackHeader,
  DialogStackNext,
  DialogStackPrevious,
  DialogStackTitle,
} from "@/components/kibo-ui/dialog-stack"

import type { ProgramWizardFormState } from "../schema"

export type ScheduleStepProps = {
  index?: number
  form: ProgramWizardFormState
  onOpenChange: (open: boolean) => void
  onEdit: (next: ProgramWizardFormState) => void
  onScheduleSave: (next: ProgramWizardFormState) => void
}

export function ScheduleStep({ index, form, onOpenChange, onEdit, onScheduleSave }: ScheduleStepProps) {
  const update = (patch: Partial<ProgramWizardFormState>) => {
    const next = { ...form, ...patch }
    onEdit(next)
    onScheduleSave(next)
  }

  return (
    <DialogStackContent index={index} className="relative min-h-[520px] sm:min-h-[560px]">
      <button
        type="button"
        onClick={() => onOpenChange(false)}
        className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md border bg-background/70 text-muted-foreground transition hover:text-foreground"
        aria-label="Close"
      >
        ×
      </button>
      <DialogStackHeader>
        <DialogStackTitle>Schedule & Location</DialogStackTitle>
        <DialogStackDescription>Pick dates and add an address.</DialogStackDescription>
      </DialogStackHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-1 sm:grid-cols-2">
          <DatePicker
            label="Start date"
            value={form.startDate}
            onChange={(value) => update({ startDate: value })}
          />
          <DatePicker
            label="End date"
            value={form.endDate}
            onChange={(value) => update({ endDate: value })}
          />
        </div>
        <TextInput
          id="location"
          label="Location (summary)"
          value={form.location}
          placeholder="e.g., Chicago, IL"
          onChange={(value) => update({ location: value })}
        />
        <TextInput
          id="addressStreet"
          label="Street"
          value={form.addressStreet}
          placeholder="123 Main St"
          onChange={(value) => update({ addressStreet: value })}
        />
        <div className="grid gap-1 sm:grid-cols-3">
          <TextInput
            id="addressCity"
            label="City"
            value={form.addressCity}
            placeholder="Chicago"
            onChange={(value) => update({ addressCity: value })}
          />
          <TextInput
            id="addressState"
            label="State"
            value={form.addressState}
            placeholder="IL"
            onChange={(value) => update({ addressState: value })}
          />
          <TextInput
            id="addressPostal"
            label="Postal"
            value={form.addressPostal}
            placeholder="60601"
            onChange={(value) => update({ addressPostal: value })}
          />
        </div>
        <TextInput
          id="addressCountry"
          label="Country"
          value={form.addressCountry}
          placeholder="United States"
          onChange={(value) => update({ addressCountry: value })}
        />
      </div>
      <DialogStackFooter>
        <Button variant="ghost" className="h-9 rounded-md px-3" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <DialogStackPrevious className="h-9 rounded-md px-3">Back</DialogStackPrevious>
        <DialogStackNext className="h-9 rounded-md bg-primary px-3 text-primary-foreground">Next</DialogStackNext>
      </DialogStackFooter>
    </DialogStackContent>
  )
}

type DatePickerProps = {
  label: string
  value?: string | null
  onChange: (value: string) => void
}

function DatePicker({ label, value, onChange }: DatePickerProps) {
  return (
    <div className="grid gap-1">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start">
            {value ? format(new Date(value), "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(date) => onChange(date ? date.toISOString() : "")}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

type TextInputProps = {
  id: string
  label: string
  value?: string | null
  placeholder?: string
  onChange: (value: string) => void
}

function TextInput({ id, label, value, placeholder, onChange }: TextInputProps) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  )
}
