"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import type { BrandIdentityColor, BrandIdentityDraft } from "../../types"
import {
  contrastRating,
  contrastRatio,
  foregroundFor,
  normalizeHex,
  normalizeProportions,
  rgbLabel,
} from "../../lib/brand-identity"
import {
  BrandIdentitySection,
  BrandIdentitySubsection,
} from "./brand-identity-section"

export function PaletteSection({
  draft,
  updateDraft,
}: {
  draft: BrandIdentityDraft
  updateDraft: (value: Partial<BrandIdentityDraft>) => void
}) {
  const updateColor = (
    id: BrandIdentityColor["id"],
    value: Partial<BrandIdentityColor>
  ) => {
    updateDraft({
      colors: draft.colors.map((color) =>
        color.id === id ? { ...color, ...value } : color
      ),
    })
  }
  const normalized = normalizeProportions(draft.colors)
  const pairs = draft.colors.flatMap((background) =>
    draft.colors
      .filter((foreground) => foreground.id !== background.id)
      .map((foreground) => ({ background, foreground }))
  )

  return (
    <BrandIdentitySection
      id="color-palette"
      eyebrow="A usable system"
      title="Color palette"
      description="Name each color by its role, set an intentional proportion, and check real contrast before using a pair for text."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {draft.colors.map((color) => {
          const value = normalizeHex(color.value)
          return (
            <div
              key={color.id}
              className="overflow-hidden rounded-md border"
              style={{ backgroundColor: value, color: foregroundFor(value) }}
            >
              <div className="min-h-40 p-4">
                <p className="text-sm font-semibold">{color.name}</p>
                <dl className="mt-16 grid grid-cols-[3rem_1fr] gap-y-1 font-mono text-[0.68rem] opacity-80">
                  <dt>HEX</dt>
                  <dd>{value}</dd>
                  <dt>RGB</dt>
                  <dd>{rgbLabel(value)}</dd>
                </dl>
              </div>
              <div className="bg-background text-foreground grid grid-cols-[1fr_7rem] gap-3 border-t p-3">
                <div>
                  <Label htmlFor={`color-name-${color.id}`} className="sr-only">
                    Color name
                  </Label>
                  <Input
                    id={`color-name-${color.id}`}
                    value={color.name}
                    onChange={(event) =>
                      updateColor(color.id, { name: event.target.value })
                    }
                    aria-label={`${color.id} color name`}
                  />
                </div>
                <div>
                  <Label
                    htmlFor={`color-value-${color.id}`}
                    className="sr-only"
                  >
                    Hex value
                  </Label>
                  <Input
                    id={`color-value-${color.id}`}
                    value={color.value}
                    onChange={(event) =>
                      updateColor(color.id, { value: event.target.value })
                    }
                    onBlur={(event) =>
                      updateColor(color.id, {
                        value: normalizeHex(event.target.value, value),
                      })
                    }
                    aria-label={`${color.name} hex value`}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <BrandIdentitySubsection
        title="Color proportions"
        description="The percentages automatically normalize to a complete system. Let the lightest surface create breathing room and reserve the strongest colors for emphasis."
      >
        <div className="flex min-h-32 overflow-hidden rounded-md border">
          {normalized.map((color) => (
            <div
              key={color.id}
              className="flex min-w-12 flex-col justify-between p-3"
              style={{
                width: `${color.proportion}%`,
                backgroundColor: normalizeHex(color.value),
                color: foregroundFor(color.value),
              }}
            >
              <span className="truncate text-xs font-semibold">
                {color.name}
              </span>
              <span className="text-xl font-semibold">
                {Math.round(color.proportion)}%
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {draft.colors.map((color) => (
            <div key={color.id}>
              <Label htmlFor={`color-proportion-${color.id}`}>
                {color.name}
              </Label>
              <Input
                id={`color-proportion-${color.id}`}
                type="number"
                min={0}
                max={100}
                value={color.proportion}
                className="mt-2"
                onChange={(event) =>
                  updateColor(color.id, {
                    proportion: Math.max(0, Number(event.target.value)),
                  })
                }
              />
            </div>
          ))}
        </div>
      </BrandIdentitySubsection>

      <BrandIdentitySubsection
        title="Accessibility"
        description="Normal body text needs at least 4.5:1 contrast. Large text may use 3:1, but higher contrast is easier to read across more settings."
      >
        <div className="divide-y border-y">
          {pairs.map(({ foreground, background }) => {
            const ratio = contrastRatio(foreground.value, background.value)
            const rating = contrastRating(ratio)
            return (
              <div
                key={`${foreground.id}-${background.id}`}
                className="grid grid-cols-[2rem_minmax(0,1fr)_4rem_3.5rem] items-center gap-3 py-3 text-xs"
              >
                <span
                  className="flex size-8 items-center justify-center rounded border font-semibold"
                  style={{
                    color: normalizeHex(foreground.value),
                    backgroundColor: normalizeHex(background.value),
                  }}
                  aria-hidden
                >
                  Aa
                </span>
                <span className="truncate">
                  {foreground.name} on {background.name}
                </span>
                <span className="text-muted-foreground text-right font-mono">
                  {ratio.toFixed(1)}:1
                </span>
                <span
                  className={
                    rating === "Fail"
                      ? "text-destructive text-right"
                      : "text-right font-semibold"
                  }
                >
                  {rating}
                </span>
              </div>
            )
          })}
        </div>
      </BrandIdentitySubsection>
    </BrandIdentitySection>
  )
}
