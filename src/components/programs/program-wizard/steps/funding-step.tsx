"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

type OrgPersonSummary = {
  id: string
  name: string
  title: string | null
  category: string
}

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
  const [people, setPeople] = useState<OrgPersonSummary[]>([])
  const [peopleLoading, setPeopleLoading] = useState(true)

  const update = (patch: Partial<ProgramWizardFormState>) => {
    const next = { ...form, ...patch }
    onEdit(next)
    onScheduleSave(next)
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setPeopleLoading(true)
      try {
        const res = await fetch("/api/account/org-people", { method: "GET" })
        const payload = (await res.json().catch(() => ({}))) as { people?: OrgPersonSummary[] }
        if (!res.ok) return
        if (cancelled) return
        setPeople(Array.isArray(payload.people) ? payload.people : [])
      } finally {
        if (!cancelled) setPeopleLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const selectablePeople = useMemo(
    () => people.filter((person) => person.id && person.name && person.category !== "supporters"),
    [people],
  )

  const selectedPeople = useMemo(() => {
    const ids = new Set(Array.isArray(form.teamIds) ? form.teamIds : [])
    return selectablePeople.filter((person) => ids.has(person.id))
  }, [form.teamIds, selectablePeople])

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
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">Team</div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Assign staff or advisors to this program.
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8"
                          disabled={peopleLoading || selectablePeople.length === 0}
                        >
                          {selectedPeople.length > 0 ? `${selectedPeople.length} selected` : "Assign"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[min(22rem,var(--radix-dropdown-menu-trigger-width))]">
                        <DropdownMenuLabel className="text-xs text-muted-foreground">Select people</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {peopleLoading ? (
                          <p className="px-2 py-3 text-sm text-muted-foreground">Loading…</p>
                        ) : selectablePeople.length === 0 ? (
                          <p className="px-2 py-3 text-sm text-muted-foreground">No team members found.</p>
                        ) : (
                          selectablePeople.map((person) => {
                            const current = Array.isArray(form.teamIds) ? form.teamIds : []
                            const checked = current.includes(person.id)
                            return (
                              <DropdownMenuCheckboxItem
                                key={person.id}
                                checked={checked}
                                onSelect={(event) => event.preventDefault()}
                                onCheckedChange={(nextChecked) => {
                                  const ids = new Set(current)
                                  if (nextChecked) ids.add(person.id)
                                  else ids.delete(person.id)
                                  update({ teamIds: Array.from(ids) })
                                }}
                                className="items-start"
                              >
                                <div className="grid min-w-0 gap-0.5">
                                  <p className="truncate text-sm font-medium text-foreground">{person.name}</p>
                                  {person.title ? (
                                    <p className="truncate text-xs text-muted-foreground">{person.title}</p>
                                  ) : null}
                                </div>
                              </DropdownMenuCheckboxItem>
                            )
                          })
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {selectedPeople.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedPeople.map((person) => (
                        <Badge key={person.id} variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                          {person.name}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
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
