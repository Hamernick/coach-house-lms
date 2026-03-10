"use client"

import { useMemo, useState } from "react"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ChevronsUpDownIcon from "lucide-react/dist/esm/icons/chevrons-up-down"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import {
  BRAND_FONT_OPTIONS,
  BRAND_FONT_WEIGHT_OPTIONS,
  BRAND_TRACKING_OPTIONS,
  BRAND_TYPOGRAPHY_PRESETS,
  resolveTypographyTrackingLabel,
} from "../lib"
import type { ReturnTypeUseWorkspaceBrandKitController } from "./workspace-brand-kit-types"

function PresetButton({
  title,
  description,
  active,
  onClick,
  disabled,
}: {
  title: string
  description: string
  active: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "group rounded-2xl border px-3 py-3 text-left transition-colors",
        active
          ? "border-foreground/20 bg-muted/80"
          : "border-border/60 bg-background/35 hover:bg-muted/50",
        disabled && "cursor-not-allowed opacity-60",
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{title}</p>
            {active ? <CheckIcon className="h-3.5 w-3.5 text-foreground" aria-hidden /> : null}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  )
}

function FontPicker({
  label,
  value,
  onSelect,
  disabled,
}: {
  label: string
  value: string
  onSelect: (value: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  const categories = useMemo(
    () => Array.from(new Set(BRAND_FONT_OPTIONS.map((option) => option.category))),
    [],
  )

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 justify-between rounded-xl"
            disabled={disabled}
          >
            <span className="truncate">{value}</span>
            <ChevronsUpDownIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[320px] p-0">
          <Command>
            <CommandInput placeholder="Search fonts..." />
            <CommandList>
              <CommandEmpty>No font found.</CommandEmpty>
              {categories.map((category) => (
                <CommandGroup key={category} heading={category}>
                  {BRAND_FONT_OPTIONS.filter((option) => option.category === category).map((option) => (
                    <CommandItem
                      key={option.id}
                      value={`${option.label} ${option.category}`}
                      onSelect={() => {
                        onSelect(option.label)
                        setOpen(false)
                      }}
                      className="py-2.5"
                    >
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                        <span className="truncate">{option.label}</span>
                        {value === option.label ? (
                          <CheckIcon className="h-4 w-4 text-foreground" aria-hidden />
                        ) : null}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function TypographyControls({
  controller,
  canEdit,
}: {
  controller: ReturnTypeUseWorkspaceBrandKitController
  canEdit: boolean
}) {
  const typography = controller.typographyConfig

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-border/60 bg-background/35 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Preset</p>
            <p className="text-xs text-muted-foreground">
              Start from a curated pairing, then override details below.
            </p>
          </div>
          {controller.typographyPreset ? (
            <Badge variant="secondary">{controller.typographyPreset.label}</Badge>
          ) : null}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {BRAND_TYPOGRAPHY_PRESETS.map((preset) => {
            const active = controller.draftProfile.brandTypographyPresetId === preset.id
            return (
              <PresetButton
                key={preset.id}
                title={preset.label}
                description={`${preset.headingFontLabel} / ${preset.bodyFontLabel}`}
                active={active}
                disabled={!canEdit}
                onClick={() => void controller.applyTypographyPreset(preset.id)}
              />
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border/60 bg-background/35 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Headings</p>
              <p className="text-xs text-muted-foreground">Used for titles, calls to action, and section labels.</p>
            </div>
            <Badge variant="outline">{typography.headings.family}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <FontPicker
              label="Font family"
              value={typography.headings.family}
              disabled={!canEdit}
              onSelect={(family) => void controller.saveTypographySlot("headings", { family })}
            />
            <div className="grid gap-2">
              <Label>Font weight</Label>
              <Select
                value={typography.headings.weight}
                onValueChange={(value) => void controller.saveTypographySlot("headings", { weight: value })}
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRAND_FONT_WEIGHT_OPTIONS.map((weight) => (
                    <SelectItem key={weight} value={weight}>
                      {weight}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tracking</Label>
              <Select
                value={typography.headings.tracking}
                onValueChange={(value) =>
                  void controller.saveTypographySlot("headings", { tracking: value as typeof typography.headings.tracking })
                }
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue>{resolveTypographyTrackingLabel(typography.headings.tracking)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BRAND_TRACKING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Body</p>
              <p className="text-xs text-muted-foreground">Used for paragraphs, descriptions, and operational copy.</p>
            </div>
            <Badge variant="outline">{typography.body.family}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <FontPicker
              label="Font family"
              value={typography.body.family}
              disabled={!canEdit}
              onSelect={(family) => void controller.saveTypographySlot("body", { family })}
            />
            <div className="grid gap-2">
              <Label>Font weight</Label>
              <Select
                value={typography.body.weight}
                onValueChange={(value) => void controller.saveTypographySlot("body", { weight: value })}
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRAND_FONT_WEIGHT_OPTIONS.map((weight) => (
                    <SelectItem key={weight} value={weight}>
                      {weight}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tracking</Label>
              <Select
                value={typography.body.tracking}
                onValueChange={(value) =>
                  void controller.saveTypographySlot("body", { tracking: value as typeof typography.body.tracking })
                }
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue>{resolveTypographyTrackingLabel(typography.body.tracking)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BRAND_TRACKING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Code</p>
            <p className="text-xs text-muted-foreground">Used for snippets, file names, and technical callouts.</p>
          </div>
          <FontPicker
            label="Font family"
            value={typography.code.family}
            disabled={!canEdit}
            onSelect={(family) => void controller.saveCodeFont(family)}
          />
        </div>
      </div>
    </div>
  )
}
