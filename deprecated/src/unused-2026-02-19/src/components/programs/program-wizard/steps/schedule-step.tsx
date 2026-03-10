"use client"

import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
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
    <DialogStackContent
      index={index}
      className="relative flex h-full w-full max-w-none flex-col overflow-hidden rounded-none border-0 bg-transparent p-0 shadow-none"
    >
      <div className="flex h-full flex-col">
        <DialogStackHeader className="shrink-0 border-b border-border/60 bg-background/95 px-6 py-4 text-left backdrop-blur">
          <DialogStackTitle className="text-xl">Schedule & Location</DialogStackTitle>
          <DialogStackDescription className="text-sm">Pick dates and add an address.</DialogStackDescription>
        </DialogStackHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto w-full max-w-5xl">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <div className="text-sm font-medium">Schedule</div>
                  <p className="mt-1 text-xs text-muted-foreground">Add dates for the full program window.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">Location</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {form.locationType === "online"
                        ? "Add a meeting link for online programs."
                        : "Use this for directions and logistics."}
                    </p>
                  </div>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    value={form.locationType}
                    onValueChange={(value) => {
                      if (!value) return
                      update({ locationType: value as ProgramWizardFormState["locationType"] })
                    }}
                  >
                    <ToggleGroupItem value="in_person">In person</ToggleGroupItem>
                    <ToggleGroupItem value="online">Online</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="mt-4 grid gap-4">
                  {form.locationType === "online" ? (
                    <TextInput
                      id="locationUrl"
                      label="Meeting link"
                      value={form.locationUrl}
                      placeholder="https://meet.google.com/…"
                      onChange={(value) => {
                        const raw = value.trim()
                        const nextValue = raw ? (raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`) : ""
                        update({ locationUrl: nextValue })
                      }}
                    />
                  ) : (
                    <>
                      <TextInput
                        id="addressStreet"
                        label="Street"
                        value={form.addressStreet}
                        placeholder="123 Main St"
                        onChange={(value) => update({ addressStreet: value })}
                      />
                      <div className="grid gap-4 sm:grid-cols-3">
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
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogStackFooter className="shrink-0 border-t border-border/60 bg-background/95 px-6 py-4 backdrop-blur">
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="h-9 px-3" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <DialogStackPrevious className="h-9 rounded-md px-3">Back</DialogStackPrevious>
            </div>
            <DialogStackNext className="h-9 rounded-md bg-primary px-4 text-primary-foreground">
              Continue
            </DialogStackNext>
          </div>
        </DialogStackFooter>
      </div>
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
