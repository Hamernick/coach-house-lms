"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
    <DialogStackContent index={index} className="relative flex min-h-[520px] flex-col sm:min-h-[560px]">
      <button
        type="button"
        onClick={() => onOpenChange(false)}
        className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md border bg-background/70 text-muted-foreground transition hover:text-foreground"
        aria-label="Close"
      >
        ×
      </button>
      <DialogStackHeader>
        <DialogStackTitle>Funding</DialogStackTitle>
        <DialogStackDescription>Goal, raised, and features.</DialogStackDescription>
      </DialogStackHeader>
      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-5">
          <div className="grid gap-2">
            <div>
              <h4 className="text-sm font-medium leading-none">Funding goals</h4>
              <p className="mt-0.5 text-xs text-muted-foreground">Set your target and current progress.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
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

          <Separator />

          <div className="grid gap-2">
            <div>
              <h4 className="text-sm font-medium leading-none">Tags</h4>
              <p className="mt-0.5 text-xs text-muted-foreground">Highlight key aspects (press Enter to add).</p>
            </div>
            <TagInput
              label="Tags"
              placeholder="Type and press Enter"
              values={form.features as string[]}
              onChange={(values) => update({ features: values })}
            />
          </div>

          <Separator />

          <div className="grid gap-2">
            <div>
              <h4 className="text-sm font-medium leading-none">Call to action</h4>
              <p className="mt-0.5 text-xs text-muted-foreground">Control the button text and destination.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput
                id="ctaLabel"
                label="Button text"
                value={form.ctaLabel ?? ""}
                placeholder="e.g., Learn more"
                onChange={(value) => update({ ctaLabel: value })}
              />
              <div className="grid gap-1">
                <Label htmlFor="ctaUrl">Button URL</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>https://</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="ctaUrl"
                    value={(form.ctaUrl ?? "").replace(/^https?:\/\//i, "")}
                    onChange={(event) => {
                      const raw = event.currentTarget.value
                      const nextValue = raw ? (raw.startsWith("http") ? raw : `https://${raw}`) : ""
                      update({ ctaUrl: nextValue })
                    }}
                    placeholder="example.org/apply"
                    className="!pl-0.5"
                  />
                </InputGroup>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DialogStackFooter>
        <Button variant="ghost" className="h-9 rounded-md px-3" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <DialogStackPrevious className="h-9 rounded-md px-3">Back</DialogStackPrevious>
        {mode === "create" ? (
          <Button onClick={onSubmit} disabled={isPending} className="h-9 rounded-md px-3">
            {isPending ? "Creating…" : "Create program"}
          </Button>
        ) : (
          <Button onClick={() => onOpenChange(false)} className="h-9 rounded-md px-3">
            Close
          </Button>
        )}
      </DialogStackFooter>
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
