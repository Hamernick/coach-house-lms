"use client"

import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react"
import Image from "next/image"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"
import PlusIcon from "lucide-react/dist/esm/icons/plus"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import {
  BRAND_ACCENT_PRESETS,
  BRAND_THEME_PRESETS,
} from "../lib"
import type { ReturnTypeUseWorkspaceBrandKitController } from "./workspace-brand-kit-types"

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "")
  if (!/^[0-9A-F]{6}$/i.test(normalized)) return null
  const value = Number.parseInt(normalized, 16)
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

function rgbToHex(rgb: { r: number; g: number; b: number }) {
  return `#${[rgb.r, rgb.g, rgb.b]
    .map((channel) => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`
}

function normalizeHex(value: string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : ""
  if (!trimmed) return ""
  const prefixed = trimmed.startsWith("#") ? trimmed : `#${trimmed}`
  return /^#[0-9a-fA-F]{6}$/i.test(prefixed) ? prefixed.toUpperCase() : trimmed
}

function parseRgbText(value: string) {
  const parts = value
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
  if (parts.length !== 3) return null
  const channels = parts.map((entry) => Number.parseInt(entry, 10))
  if (channels.some((channel) => !Number.isInteger(channel) || channel < 0 || channel > 255)) {
    return null
  }
  return {
    r: channels[0]!,
    g: channels[1]!,
    b: channels[2]!,
  }
}

function formatRgbText(value: string) {
  const rgb = hexToRgb(value)
  if (!rgb) return ""
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`
}

export function BrandAssetPreview({
  src,
  label,
  fallback,
  className,
}: {
  src: string | null | undefined
  label: string
  fallback: string
  className?: string
}) {
  const hasImage = typeof src === "string" && src.trim().length > 0

  return (
    <div
      className={cn(
        "border-border/60 bg-background relative flex h-24 items-center justify-center overflow-hidden rounded-2xl border",
        className,
      )}
    >
      {hasImage ? (
        <Image
          src={src as string}
          alt={label}
          fill
          sizes="240px"
          className="object-contain p-3"
        />
      ) : (
        <span className="text-muted-foreground px-4 text-center text-xs">{fallback}</span>
      )}
    </div>
  )
}

export function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

export function UploadControl({
  id,
  title,
  helper,
  pending,
  hasAsset = false,
  onFileSelect,
}: {
  id: string
  title: string
  helper: string
  pending: boolean
  hasAsset?: boolean
  onFileSelect: (file: File) => void
}) {
  return (
    <div className="grid gap-2 rounded-2xl border border-border/60 bg-background/40 p-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{helper}</p>
      </div>
      <input
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (!file) return
          onFileSelect(file)
          event.currentTarget.value = ""
        }}
      />
      <Button type="button" variant="outline" asChild disabled={pending}>
        <label htmlFor={id} className="cursor-pointer">
          {pending ? (
            <>
              <Loader2Icon className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Uploading...
            </>
          ) : (
            <>{hasAsset ? "Replace file" : "Choose file"}</>
          )}
        </label>
      </Button>
    </div>
  )
}

function SwatchStrip({ colors }: { colors: string[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {colors.map((color) => (
        <span
          key={color}
          className="h-4 w-4 rounded-md border border-black/10"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      ))}
    </div>
  )
}

function PresetButton({
  title,
  description,
  colors,
  active,
  onClick,
  disabled,
}: {
  title: string
  description: string
  colors: string[]
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
        <SwatchStrip colors={colors} />
      </div>
    </button>
  )
}

function AccentButton({
  title,
  colors,
  active,
  onClick,
  disabled,
}: {
  title: string
  colors: string[]
  active: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors",
        active
          ? "border-foreground/20 bg-muted/80"
          : "border-border/60 bg-background/35 hover:bg-muted/50",
        disabled && "cursor-not-allowed opacity-60",
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <SwatchStrip colors={colors} />
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
      {active ? <CheckIcon className="h-3.5 w-3.5 text-foreground" aria-hidden /> : null}
    </button>
  )
}

type ColorInputMode = "hex" | "rgb"

export function ColorPopoverField({
  label,
  value,
  disabled,
  onCommit,
}: {
  label: string
  value: string
  disabled?: boolean
  onCommit: (nextValue: string) => Promise<boolean | void>
}) {
  const normalizedValue = normalizeHex(value) || "#CBD5E1"
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<ColorInputMode>("hex")
  const [draft, setDraft] = useState(normalizedValue)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setDraft(mode === "hex" ? normalizedValue : formatRgbText(normalizedValue))
  }, [mode, normalizedValue])

  const commit = async () => {
    const nextHex =
      mode === "hex"
        ? normalizeHex(draft)
        : (() => {
            const rgb = parseRgbText(draft)
            return rgb ? rgbToHex(rgb) : ""
          })()

    if (!/^#[0-9A-F]{6}$/i.test(nextHex)) {
      setError(mode === "hex" ? "Use a six-digit hex value." : "Use RGB values from 0 to 255.")
      return
    }

    setError(null)
    setIsSaving(true)
    const result = await onCommit(nextHex)
    setIsSaving(false)
    if (result !== false) {
      setOpen(false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return
    event.preventDefault()
    void commit()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 justify-between rounded-xl"
          disabled={disabled}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="h-4 w-4 rounded-md border border-black/10"
              style={{ backgroundColor: normalizedValue }}
              aria-hidden
            />
            <span className="truncate">{label}</span>
          </span>
          <span className="text-xs text-muted-foreground">{normalizedValue}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-3">
        <div className="space-y-2">
          <Label htmlFor={`${label}-picker`} className="text-xs text-muted-foreground">
            {label}
          </Label>
          <Input
            id={`${label}-picker`}
            type="color"
            value={normalizedValue}
            onChange={(event) => {
              const nextValue = event.currentTarget.value.toUpperCase()
              setDraft(mode === "hex" ? nextValue : formatRgbText(nextValue))
              setError(null)
            }}
            className="h-12 rounded-xl p-1"
            disabled={disabled}
          />
        </div>

        <div className="inline-flex rounded-full bg-muted/70 p-1">
          {(["hex", "rgb"] as const).map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "h-7 rounded-full px-3 text-[11px] font-medium",
                mode === option
                  ? "bg-background text-foreground shadow-sm hover:bg-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => {
                setMode(option)
                setError(null)
              }}
            >
              {option.toUpperCase()}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${label}-value`}>
            {mode === "hex" ? "Hex value" : "RGB value"}
          </Label>
          <Input
            id={`${label}-value`}
            value={draft}
            onChange={(event) => {
              setDraft(event.currentTarget.value)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            placeholder={mode === "hex" ? "#0F172A" : "15, 23, 42"}
            disabled={disabled || isSaving}
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={() => void commit()} disabled={disabled || isSaving}>
            {isSaving ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
            Save color
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function ThemePresetSection({
  controller,
  canEdit,
}: {
  controller: ReturnTypeUseWorkspaceBrandKitController
  canEdit: boolean
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {BRAND_THEME_PRESETS.map((preset) => (
        <PresetButton
          key={preset.id}
          title={preset.label}
          description={preset.description}
          colors={preset.swatches}
          active={controller.draftProfile.brandThemePresetId === preset.id}
          disabled={!canEdit}
          onClick={() => void controller.applyThemePreset(preset.id)}
        />
      ))}
    </div>
  )
}

export function AccentPresetSection({
  controller,
  canEdit,
}: {
  controller: ReturnTypeUseWorkspaceBrandKitController
  canEdit: boolean
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {BRAND_ACCENT_PRESETS.map((preset) => (
        <AccentButton
          key={preset.id}
          title={preset.label}
          colors={preset.swatches}
          active={controller.draftProfile.brandAccentPresetId === preset.id}
          disabled={!canEdit}
          onClick={() => void controller.applyAccentPreset(preset.id)}
        />
      ))}
    </div>
  )
}

export function CustomPaletteSection({
  controller,
  canEdit,
}: {
  controller: ReturnTypeUseWorkspaceBrandKitController
  canEdit: boolean
}) {
  const colors = Array.isArray(controller.draftProfile.brandColors)
    ? controller.draftProfile.brandColors
    : []

  return (
    <div className="grid gap-3 rounded-2xl border border-border/60 bg-background/35 p-4">
      <ColorPopoverField
        label="Primary color"
        value={controller.draftProfile.brandPrimary ?? "#0F172A"}
        disabled={!canEdit}
        onCommit={controller.savePrimaryColor}
      />
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Supporting colors</p>
            <p className="text-xs text-muted-foreground">Up to four additional colors for flyers, decks, and social graphics.</p>
          </div>
          {canEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void controller.addPaletteColor()}
              disabled={colors.length >= 4}
            >
              <PlusIcon className="h-3.5 w-3.5" aria-hidden />
              Add color
            </Button>
          ) : null}
        </div>
        {colors.length > 0 ? (
          <div className="grid gap-2">
            {colors.map((color, index) => (
              <div key={`${color}-${index}`} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <ColorPopoverField
                    label={`Supporting color ${index + 1}`}
                    value={color}
                    disabled={!canEdit}
                    onCommit={(nextValue) => controller.savePaletteColor(index, nextValue)}
                  />
                </div>
                {canEdit ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl"
                    onClick={() => void controller.removePaletteColor(index)}
                    aria-label={`Remove supporting color ${index + 1}`}
                  >
                    <XIcon className="h-4 w-4" aria-hidden />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 bg-background/30 px-4 py-5 text-sm text-muted-foreground">
            Add a few supporting colors if your team needs more than the primary accent.
          </div>
        )}
      </div>
    </div>
  )
}
