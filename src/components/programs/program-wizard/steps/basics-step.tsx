"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DialogStackContent,
  DialogStackDescription,
  DialogStackFooter,
  DialogStackHeader,
  DialogStackNext,
  DialogStackTitle,
} from "@/components/kibo-ui/dialog-stack"

import type { ProgramWizardFormState } from "../schema"
import Image from "next/image"

export type BasicsStepProps = {
  form: ProgramWizardFormState
  onOpenChange: (open: boolean) => void
  onEdit: (next: ProgramWizardFormState) => void
  onScheduleSave: (next: ProgramWizardFormState) => void
  onUpload: (file: File | null | undefined) => Promise<void>
}

export function BasicsStep({
  form,
  onOpenChange,
  onEdit,
  onScheduleSave,
  onUpload}: BasicsStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const update = (patch: Partial<ProgramWizardFormState>) => {
    const next = { ...form, ...patch }
    onEdit(next)
    onScheduleSave(next)
  }

  return (
    <DialogStackContent className="relative min-h-[520px] sm:min-h-[560px]">
      <button
        type="button"
        onClick={() => onOpenChange(false)}
        className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md border bg-background/70 text-muted-foreground transition hover:text-foreground"
        aria-label="Close"
      >
        ×
      </button>
      <DialogStackHeader>
        <DialogStackTitle>Basics</DialogStackTitle>
        <DialogStackDescription>Cover image, title, and status.</DialogStackDescription>
      </DialogStackHeader>
      <div className="grid gap-4 py-4">
        <div
          className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-program-image)] border bg-muted"
          onDragOver={(event) => event.preventDefault()}
          onDrop={async (event) => {
            event.preventDefault()
            const file = event.dataTransfer.files?.[0]
            await onUpload(file)
          }}
        >
          {form.imageUrl ? (
            <Image
              src={form.imageUrl}
              alt="Cover"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 420px"
              unoptimized={!form.imageUrl?.startsWith("http")}
            />
          ) : null}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-black/0 p-3 text-white">
            <div className="text-sm font-medium">{form.title || "Program title"}</div>
            <div className="text-xs opacity-85">{form.subtitle || "Subtitle"}</div>
          </div>
          <div className="absolute right-3 top-3 flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
              Upload image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.currentTarget.files?.[0]
                await onUpload(file)
              }}
            />
          </div>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(event) => update({ title: event.currentTarget.value })}
            placeholder="e.g., Urban Greening Fellowship"
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={form.subtitle}
            onChange={(event) => update({ subtitle: event.currentTarget.value })}
            placeholder="e.g., Coach House Foundation · Chicago, IL"
          />
        </div>
        <div className="grid gap-1">
          <Label>Status</Label>
          <Select
            value={form.statusLabel as string}
            onValueChange={(value) => update({ statusLabel: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Planned">Planned</SelectItem>
              <SelectItem value="In progress">In progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
              <SelectItem value="Applications Open">Applications Open</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogStackFooter>
        <Button variant="ghost" className="h-9 rounded-md px-3" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <DialogStackNext className="h-9 rounded-md bg-primary px-3 text-primary-foreground">Next</DialogStackNext>
      </DialogStackFooter>
    </DialogStackContent>
  )
}
