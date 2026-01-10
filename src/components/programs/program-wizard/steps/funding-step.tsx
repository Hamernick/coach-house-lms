"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import {
  DialogStackContent,
  DialogStackDescription,
  DialogStackFooter,
  DialogStackHeader,
  DialogStackPrevious,
  DialogStackTitle,
} from "@/components/kibo-ui/dialog-stack"

import type { ProgramWizardFormState } from "../schema"
import { TagInput } from "../tag-input"

export type FundingStepProps = {
  index?: number
  form: ProgramWizardFormState
  onOpenChange: (open: boolean) => void
  onEdit: (next: ProgramWizardFormState) => void
  onScheduleSave: (next: ProgramWizardFormState) => void
  mode: "create" | "edit"
  isPending: boolean
  onSubmit: () => void
}

export function FundingStep({
  index,
  form,
  onOpenChange,
  onEdit,
  onScheduleSave,
  mode,
  isPending,
  onSubmit,
}: FundingStepProps) {
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
          <DialogStackTitle className="text-xl">Funding</DialogStackTitle>
          <DialogStackDescription className="text-sm">Goal, raised, and features.</DialogStackDescription>
        </DialogStackHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto w-full max-w-5xl">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div className="space-y-4">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <div className="text-sm font-medium">Funding goals</div>
                  <p className="mt-1 text-xs text-muted-foreground">Set your target and current progress.</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <CurrencyInput
                      id="goal"
                      label="Goal"
                      value={form.goalUsd ?? 0}
                      onChange={(value) => update({ goalUsd: value })}
                    />
                    <CurrencyInput
                      id="raised"
                      label="Raised"
                      value={form.raisedUsd ?? 0}
                      onChange={(value) => update({ raisedUsd: value })}
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <div className="text-sm font-medium">Tags</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Highlight key aspects (press Enter to add).
                  </p>
                  <div className="mt-3">
                    <TagInput
                      label="Tags"
                      placeholder="Type and press Enter"
                      values={form.features as string[]}
                      maxTags={3}
                      maxLength={17}
                      onChange={(values) => update({ features: values })}
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 lg:self-start">
                <div className="text-sm font-medium">Call to action</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Control the button text and destination.
                </p>
                <div className="mt-4 grid gap-4">
                  <TextInput
                    id="ctaLabel"
                    label="Button text"
                    value={form.ctaLabel ?? ""}
                    placeholder="e.g., Donate"
                    onChange={(value) => update({ ctaLabel: value })}
                  />
                  <div className="grid gap-1">
                    <Label htmlFor="ctaUrl">Button URL</Label>
                    <InputGroup>
                      <InputGroupInput
                        id="ctaUrl"
                        value={form.ctaUrl ?? ""}
                        onChange={(event) => {
                          const raw = event.currentTarget.value.trim()
                          const nextValue = raw ? (raw.startsWith("http") ? raw : `https://${raw}`) : ""
                          update({ ctaUrl: nextValue })
                        }}
                        placeholder="https://www.example.org/apple"
                      />
                    </InputGroup>
                  </div>
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
            {mode === "create" ? (
              <Button onClick={onSubmit} disabled={isPending} className="h-9 rounded-md px-4">
                {isPending ? "Creating…" : "Create program"}
              </Button>
            ) : (
              <Button onClick={() => onOpenChange(false)} className="h-9 rounded-md px-4">
                Close
              </Button>
            )}
          </div>
        </DialogStackFooter>
      </div>
    </DialogStackContent>
  )
}

type CurrencyInputProps = {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
}

function CurrencyInput({ id, label, value, onChange }: CurrencyInputProps) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={id}>{label}</Label>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>$</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(Number(event.currentTarget.value || 0))}
          placeholder="0.00"
        />
      </InputGroup>
    </div>
  )
}

type TextInputProps = {
  id: string
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}

function TextInput({ id, label, value, placeholder, onChange }: TextInputProps) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  )
}
