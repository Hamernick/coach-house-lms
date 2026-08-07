"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  BrandTypographyConfig,
  OrgProfile,
} from "@/lib/organization/org-profile-brand-types"

import {
  BRAND_FONT_OPTIONS,
  BRAND_FONT_WEIGHT_OPTIONS,
  resolveBrandTypographyConfig,
} from "../lib"
import { ColorPopoverField } from "./workspace-brand-kit-sheet-controls"
import type { WorkspaceBrandKitProfileEditorProps } from "./workspace-brand-kit-profile-editor-types"

const COLOR_FIELDS = [
  { label: "Primary", fallback: "#6C3AED", index: null },
  { label: "Dark", fallback: "#1E1E1E", index: 0 },
  { label: "Light", fallback: "#F9FAFB", index: 1 },
  { label: "Accent", fallback: "#10B981", index: 2 },
] as const

const FONT_CATEGORIES = ["Sans Serif", "Serif", "Monospace"] as const

function TypographyRow({
  label,
  description,
  slot,
  onChange,
}: {
  label: string
  description: string
  slot: BrandTypographyConfig["headings"]
  onChange: (updates: Partial<BrandTypographyConfig["headings"]>) => void
}) {
  return (
    <div className="border-border/60 bg-muted/20 grid gap-3 rounded-xl border p-3 sm:grid-cols-[minmax(8rem,1fr)_minmax(0,1.25fr)_7rem] sm:items-end">
      <div className="min-w-0">
        <p className="text-foreground text-lg font-semibold">Aa</p>
        <p className="text-foreground text-sm font-medium">{label}</p>
        <p className="text-muted-foreground mt-1 text-xs text-pretty">
          {description}
        </p>
      </div>
      <Select
        value={slot.family}
        onValueChange={(family) => onChange({ family })}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a font" />
        </SelectTrigger>
        <SelectContent>
          {FONT_CATEGORIES.map((category) => (
            <SelectGroup key={category}>
              <SelectLabel>{category}</SelectLabel>
              {BRAND_FONT_OPTIONS.filter(
                (option) => option.category === category
              ).map((option) => (
                <SelectItem key={option.id} value={option.label}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={slot.weight}
        onValueChange={(weight) => onChange({ weight })}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Weight" />
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
  )
}

export function WorkspaceBrandKitProfileStyle({
  profile,
  onChange,
}: Pick<WorkspaceBrandKitProfileEditorProps, "profile" | "onChange">) {
  const typography = resolveBrandTypographyConfig(profile)

  const updateColor = (index: number | null, nextValue: string) => {
    if (index === null) {
      onChange({ brandPrimary: nextValue })
      return
    }

    const colors = Array.isArray(profile.brandColors)
      ? [...profile.brandColors]
      : []
    while (colors.length <= index) {
      colors.push(COLOR_FIELDS[colors.length + 1]?.fallback ?? "#CBD5E1")
    }
    colors[index] = nextValue
    onChange({ brandColors: colors })
  }

  const updateTypography = (
    slot: "headings" | "body",
    updates: Partial<BrandTypographyConfig["headings"]>
  ) => {
    const nextTypography: BrandTypographyConfig = {
      ...typography,
      [slot]: {
        ...typography[slot],
        ...updates,
      },
    }
    onChange({
      brandTypography: nextTypography,
      brandTypographyPresetId: "",
    } satisfies Partial<OrgProfile>)
  }

  return (
    <div className="grid gap-6">
      <section className="space-y-3">
        <div>
          <h4 className="text-foreground text-sm font-semibold text-balance">
            Colors
          </h4>
          <p className="text-muted-foreground mt-1 text-xs text-pretty">
            Set the four colors your team should use consistently.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {COLOR_FIELDS.map((field) => {
            const value =
              field.index === null
                ? profile.brandPrimary
                : profile.brandColors?.[field.index]
            return (
              <ColorPopoverField
                key={field.label}
                label={field.label}
                value={value || field.fallback}
                commitLabel="Use color"
                onCommit={async (nextValue) => {
                  updateColor(field.index, nextValue)
                  return true
                }}
              />
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h4 className="text-foreground text-sm font-semibold text-balance">
            Typography
          </h4>
          <p className="text-muted-foreground mt-1 text-xs text-pretty">
            Choose the heading and body fonts used across brand materials.
          </p>
        </div>
        <div className="grid gap-2">
          <TypographyRow
            label="Headings"
            description="Titles and calls to action"
            slot={typography.headings}
            onChange={(updates) => updateTypography("headings", updates)}
          />
          <TypographyRow
            label="Body"
            description="Paragraphs and supporting copy"
            slot={typography.body}
            onChange={(updates) => updateTypography("body", updates)}
          />
        </div>
      </section>
    </div>
  )
}
