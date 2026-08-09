import Image from "next/image"
import XCircleIcon from "lucide-react/dist/esm/icons/circle-x"

import { Separator } from "@/components/ui/separator"
import type { OrgProfile } from "@/lib/organization/org-profile-brand-types"

import { resolveBrandTypographyConfig } from "../lib"

const COLOR_LABELS = ["Primary", "Dark", "Light", "Accent"] as const

function value(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : ""
}

export function hasWorkspaceBrandKitProfileContent(profile: OrgProfile) {
  return Boolean(
    value(profile.logoUrl) ||
    value(profile.brandMarkUrl) ||
    value(profile.brandPrimary) ||
    profile.brandColors?.some((color) => value(color)) ||
    profile.brandTypography ||
    value(profile.brandTypographyPresetId) ||
    value(profile.brandVoiceAudience) ||
    value(profile.brandVoiceTone) ||
    value(profile.brandVoiceStyle) ||
    value(profile.brandVoicePersonality) ||
    value(profile.brandVoiceGuidelines) ||
    value(profile.brandVoiceAvoid)
  )
}

function AssetPreview({
  src,
  label,
  compact = false,
}: {
  src: string
  label: string
  compact?: boolean
}) {
  return (
    <div
      className={
        compact
          ? "border-border/60 bg-muted/20 grid gap-2 rounded-xl border p-3"
          : "border-border/60 bg-muted/20 grid gap-2 rounded-xl border p-3 sm:col-span-2"
      }
    >
      <div className={compact ? "relative h-24" : "relative h-28"}>
        <Image
          src={src}
          alt={`${label} brand asset`}
          fill
          sizes={compact ? "180px" : "520px"}
          className="object-contain p-2"
        />
      </div>
      <p className="text-muted-foreground text-center text-xs font-medium">
        {label}
      </p>
    </div>
  )
}

function BrandVoicePreview({ profile }: { profile: OrgProfile }) {
  const attributes = [
    ["Audience", value(profile.brandVoiceAudience)],
    ["Tone", value(profile.brandVoiceTone)],
    ["Style", value(profile.brandVoiceStyle)],
    ["Personality", value(profile.brandVoicePersonality)],
  ].filter((entry) => entry[1])
  const guidelines = value(profile.brandVoiceGuidelines)
  const avoid = value(profile.brandVoiceAvoid)
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean)

  if (attributes.length === 0 && !guidelines && avoid.length === 0) return null

  return (
    <section className="space-y-3">
      <h4 className="text-foreground text-sm font-semibold text-balance">
        Brand voice
      </h4>
      {attributes.length > 0 ? (
        <dl className="grid gap-2 sm:grid-cols-2">
          {attributes.map(([label, content]) => (
            <div
              key={label}
              className="border-border/60 bg-muted/20 flex min-w-0 items-start justify-between gap-4 rounded-lg border px-3 py-2.5"
            >
              <dt className="text-muted-foreground text-xs">{label}</dt>
              <dd className="text-foreground min-w-0 text-right text-sm">
                {content}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {guidelines ? (
        <div className="border-border/60 bg-background rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-medium">
            Guidelines
          </p>
          <p className="text-foreground mt-2 text-sm leading-relaxed text-pretty whitespace-pre-wrap">
            {guidelines}
          </p>
        </div>
      ) : null}
      {avoid.length > 0 ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">Avoid</p>
          {avoid.map((item) => (
            <div
              key={item}
              className="border-border/60 bg-muted/20 flex items-start gap-2 rounded-lg border px-3 py-2.5"
            >
              <XCircleIcon
                className="text-destructive mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              <p className="text-foreground text-sm text-pretty">{item}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export function WorkspaceBrandKitProfilePreview({
  profile,
}: {
  profile: OrgProfile
}) {
  const logoUrl = value(profile.logoUrl)
  const markUrl = value(profile.brandMarkUrl)
  const colors = [
    value(profile.brandPrimary),
    ...(profile.brandColors ?? []).slice(0, 3).map(value),
  ].filter(Boolean)
  const showTypography = Boolean(
    profile.brandTypography || value(profile.brandTypographyPresetId)
  )
  const typography = resolveBrandTypographyConfig(profile)

  return (
    <div className="border-border/60 bg-background grid gap-4 rounded-xl border p-3 sm:p-4">
      {colors.length > 0 ? (
        <section className="space-y-3">
          <h4 className="text-foreground text-sm font-semibold text-balance">
            Colors
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {colors.map((color, index) => (
              <div
                key={`${color}-${index}`}
                className="border-border/60 bg-muted/20 flex items-center gap-3 rounded-xl border p-3"
              >
                <span
                  className="size-9 shrink-0 rounded-full border border-black/10"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-foreground text-sm font-medium">
                    {COLOR_LABELS[index]}
                  </p>
                  <p className="text-muted-foreground text-xs">{color}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {colors.length > 0 && showTypography ? <Separator /> : null}

      {showTypography ? (
        <section className="space-y-3">
          <h4 className="text-foreground text-sm font-semibold text-balance">
            Typography
          </h4>
          <div className="grid gap-2">
            {[
              ["Headings", typography.headings],
              ["Body", typography.body],
            ].map(([label, slot]) => {
              const type = slot as typeof typography.headings
              return (
                <div
                  key={label as string}
                  className="border-border/60 bg-muted/20 flex items-center justify-between gap-4 rounded-xl border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-foreground text-lg font-semibold">Aa</p>
                    <p className="text-muted-foreground text-xs">
                      {label as string}
                    </p>
                  </div>
                  <p className="text-foreground min-w-0 text-right text-sm font-medium">
                    {type.family} · {type.weight}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {(colors.length > 0 || showTypography) && (logoUrl || markUrl) ? (
        <Separator />
      ) : null}

      {logoUrl || markUrl ? (
        <section className="space-y-3">
          <h4 className="text-foreground text-sm font-semibold text-balance">
            Logos
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {logoUrl ? <AssetPreview src={logoUrl} label="Primary" /> : null}
            {markUrl ? (
              <AssetPreview src={markUrl} label="Mark" compact />
            ) : null}
          </div>
        </section>
      ) : null}

      {(colors.length > 0 || showTypography || logoUrl || markUrl) &&
      (value(profile.brandVoiceAudience) ||
        value(profile.brandVoiceTone) ||
        value(profile.brandVoiceStyle) ||
        value(profile.brandVoicePersonality) ||
        value(profile.brandVoiceGuidelines) ||
        value(profile.brandVoiceAvoid)) ? (
        <Separator />
      ) : null}

      <BrandVoicePreview profile={profile} />
    </div>
  )
}
