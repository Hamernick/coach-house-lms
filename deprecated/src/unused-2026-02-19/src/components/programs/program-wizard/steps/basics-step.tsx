"use client"

import { useRef, useState } from "react"
import ImageIcon from "lucide-react/dist/esm/icons/image"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  DialogStackContent,
  DialogStackDescription,
  DialogStackFooter,
  DialogStackHeader,
  DialogStackNext,
  DialogStackTitle,
} from "@/components/kibo-ui/dialog-stack"
import { cn } from "@/lib/utils"
import { publicSharingEnabled } from "@/lib/feature-flags"

import type { ProgramWizardFormState } from "../schema"

export type BasicsStepProps = {
  index?: number
  form: ProgramWizardFormState
  onOpenChange: (open: boolean) => void
  onEdit: (next: ProgramWizardFormState) => void
  onScheduleSave: (next: ProgramWizardFormState) => void
  onUpload: (file: File | null | undefined) => Promise<void>
}

export function BasicsStep({
  index,
  form,
  onOpenChange,
  onEdit,
  onScheduleSave,
  onUpload,
}: BasicsStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const sharingEnabled = publicSharingEnabled

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
          <DialogStackTitle className="text-xl">Basics</DialogStackTitle>
          <DialogStackDescription className="text-sm">Cover image, title, and status.</DialogStackDescription>
        </DialogStackHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto w-full max-w-5xl">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <div
                  className={cn(
                    "relative flex h-[220px] items-center justify-center overflow-hidden rounded-2xl border bg-muted/30 sm:h-[240px]",
                    form.imageUrl ? "border-solid" : "border-dashed border-border/70",
                    isDragging ? "ring-2 ring-primary/30 ring-offset-2 ring-offset-background" : "",
                  )}
                  onDragOver={(event) => event.preventDefault()}
                  onDragEnter={() => setIsDragging(true)}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={async (event) => {
                    event.preventDefault()
                    setIsDragging(false)
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
                      sizes="(max-width: 768px) 100vw, 620px"
                      unoptimized={!form.imageUrl?.startsWith("http")}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-muted-foreground shadow-sm ring-1 ring-border/60">
                        <ImageIcon className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">Cover image</p>
                        <p className="text-xs text-muted-foreground">Drag and drop or upload a JPG/PNG.</p>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                        Upload image
                      </Button>
                    </div>
                  )}
                  {form.imageUrl ? (
                    <div className="absolute right-3 top-3">
                      <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                        Replace image
                      </Button>
                    </div>
                  ) : null}
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
                <div className="grid gap-4">
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
                      placeholder="e.g., Coaching · Chicago, IL"
                    />
                  </div>
                  <div className="grid gap-2 rounded-2xl border border-border/60 bg-background p-4">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={form.description ?? ""}
                      onChange={(event) => update({ description: event.currentTarget.value })}
                      placeholder="Set a description to the program for better visibility."
                      className="min-h-[160px] bg-white/60 dark:bg-background"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <Switch
                      id="programPublished"
                      checked={Boolean(form.isPublic)}
                      disabled={!sharingEnabled}
                      onCheckedChange={(value) => update({ isPublic: Boolean(value) })}
                      aria-label="Publish program"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="programPublished" className="text-xs text-muted-foreground">
                        {form.isPublic ? "Published" : "Unpublished"}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {sharingEnabled
                          ? "Visible on your public profile."
                          : "Public sharing will be available after launch."}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-border/60 pt-4">
                  <div className="text-sm font-medium">Status</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This label shows on your program card and roadmap.
                  </p>
                  <div className="mt-3">
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
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogStackFooter className="shrink-0 border-t border-border/60 bg-background/95 px-6 py-4 backdrop-blur">
          <div className="flex w-full items-center justify-between gap-3">
            <Button variant="ghost" className="h-9 px-3" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <DialogStackNext className="h-9 rounded-md bg-primary px-4 text-primary-foreground">
              Continue
            </DialogStackNext>
          </div>
        </DialogStackFooter>
      </div>
    </DialogStackContent>
  )
}
