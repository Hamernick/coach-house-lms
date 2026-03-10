"use client"

import MailIcon from "lucide-react/dist/esm/icons/mail"
import ImageIcon from "lucide-react/dist/esm/icons/image"
import TypeIcon from "lucide-react/dist/esm/icons/type"

import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  BRAND_FONT_OPTIONS,
  resolveBrandFontOption,
  type BrandFontCategory,
  type BrandFontOption,
} from "../lib"
import type { ReturnTypeUseWorkspaceBrandKitController } from "./workspace-brand-kit-types"

const TRACKING_TO_LETTER_SPACING = {
  tighter: "-0.045em",
  tight: "-0.025em",
  normal: "0em",
  wide: "0.02em",
  wider: "0.04em",
} as const

const FONT_STACKS: Record<string, string> = {
  Geist: 'var(--font-geist-sans), "Inter", ui-sans-serif, system-ui, sans-serif',
  Karla: '"Karla", var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  Inter: '"Inter", var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  "Inter Tight": '"Inter Tight", "Inter", var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  "Mona Sans": '"Mona Sans", var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  Roboto: '"Roboto", var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  "Space Grotesk": '"Space Grotesk", var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  "IBM Plex Sans": '"IBM Plex Sans", var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  "Public Sans": '"Public Sans", var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  "Source Sans 3": '"Source Sans 3", var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  "Work Sans": '"Work Sans", var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  Satoshi: '"Satoshi", var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  "Alegreya Sans": '"Alegreya Sans", var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  Fraunces: '"Fraunces", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  "Cormorant Garamond": '"Cormorant Garamond", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  "Geist Mono": 'var(--font-geist-mono), "JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
  "IBM Plex Mono": '"IBM Plex Mono", var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace',
}

function toInitials(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return "OH"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts.at(-1)!.slice(0, 1)}`.toUpperCase()
}

function resolveFontStack(family: string) {
  const explicit = FONT_STACKS[family]
  if (explicit) return explicit

  const option = resolveBrandFontOption(family)
  if (option?.category === "Serif") {
    return 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
  }
  if (option?.category === "Monospace") {
    return 'var(--font-geist-mono), "JetBrains Mono", ui-monospace, SFMono-Regular, monospace'
  }
  return 'var(--font-geist-sans), "Inter", ui-sans-serif, system-ui, sans-serif'
}

function buildSampleEmail(orgName: string, orgEmail: string) {
  return {
    subject: `Subject: Quick update from ${orgName}`,
    greeting: "Hi there,",
    paragraphs: [
      `I wanted to share a short update from ${orgName}. We are shaping the next phase of our outreach materials, refining the calendar for the season ahead, and preparing a clearer partner-facing story for the work we are building.`,
      "If it would be useful, I would be glad to set up a brief check-in next week and walk through our current priorities, upcoming milestones, and the best way to stay involved.",
    ],
    signoff: `With appreciation,\n${orgName}\n${orgEmail}`,
  }
}

const FONT_PICKER_CATEGORIES: BrandFontCategory[] = ["Sans Serif", "Serif"]

function FontSelectItemPreview({
  option,
}: {
  option: BrandFontOption
}) {
  const fontFamily = resolveFontStack(option.label)

  return (
    <div className="rounded-[20px] border border-border/60 bg-background/95 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{option.label}</p>
          <p className="text-[11px] text-muted-foreground">{option.category}</p>
        </div>
        <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Preview
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3" style={{ fontFamily }}>
        <div className="flex flex-col gap-1">
          <p className="text-[2rem] leading-none text-foreground" style={{ fontWeight: 700 }}>
            Lorem ipsum
          </p>
          <p className="text-base leading-snug text-foreground/90" style={{ fontWeight: 600 }}>
            Dolor sit amet consectetur
          </p>
          <p className="text-sm leading-6 text-muted-foreground" style={{ fontWeight: 400 }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-foreground">
          <div className="rounded-xl border border-border/60 bg-muted/25 px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Regular
            </p>
            <p className="mt-1 text-sm" style={{ fontWeight: 400 }}>
              Aa
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/25 px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Medium
            </p>
            <p className="mt-1 text-sm" style={{ fontWeight: 500 }}>
              Aa
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/25 px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Bold
            </p>
            <p className="mt-1 text-sm" style={{ fontWeight: 700 }}>
              Aa
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FontSelectPreviewItem({
  option,
}: {
  option: BrandFontOption
}) {
  return (
    <HoverCard openDelay={90} closeDelay={90}>
      <HoverCardTrigger asChild>
        <SelectItem value={option.label}>{option.label}</SelectItem>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={12}
        className="w-[24rem] rounded-[24px] p-0"
      >
        <FontSelectItemPreview option={option} />
      </HoverCardContent>
    </HoverCard>
  )
}

export function WorkspaceBrandKitCompactTypographyPicker({
  controller,
  canEdit,
}: {
  controller: ReturnTypeUseWorkspaceBrandKitController
  canEdit: boolean
}) {
  const { typographyConfig, draftProfile, pendingKey, isRefreshing } = controller
  const orgName = draftProfile.name?.trim() || "Your Organization"
  const orgTagline = draftProfile.tagline?.trim() || "A concise mission or positioning line goes here."
  const orgEmail = draftProfile.email?.trim() || "hello@yourorg.org"
  const logoUrl = draftProfile.logoUrl?.trim() || null
  const accentColor = draftProfile.brandPrimary?.trim() || "#57534E"
  const titleStyle = {
    fontFamily: resolveFontStack(typographyConfig.headings.family),
    fontWeight: Number(typographyConfig.headings.weight),
    letterSpacing: TRACKING_TO_LETTER_SPACING[typographyConfig.headings.tracking],
  }
  const emailStyle = {
    fontFamily: resolveFontStack(typographyConfig.body.family),
    fontWeight: Number(typographyConfig.body.weight),
    letterSpacing: TRACKING_TO_LETTER_SPACING[typographyConfig.body.tracking],
  }
  const sampleEmail = buildSampleEmail(orgName, orgEmail)
  const typographyBusy =
    isRefreshing || pendingKey === "brandTypography" || pendingKey === "brandTypographyPresetId"

  const updateFamily = async (slot: "headings" | "body", family: string) => {
    controller.updateTypographySlot(slot, { family })
    await controller.saveTypographySlot(slot, { family })
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-background/35 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <TypeIcon className="h-3.5 w-3.5" aria-hidden />
          Typography
        </div>
        <HoverCard openDelay={150} closeDelay={100}>
          <HoverCardTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 rounded-full px-2 text-[11px] text-muted-foreground"
              aria-label="Preview typography"
            >
              Preview
            </Button>
          </HoverCardTrigger>
          <HoverCardContent align="end" side="top" className="w-[28rem] rounded-[22px] p-0">
            <div className="border-b border-border/60 px-4 py-4" style={{ backgroundColor: `${accentColor}10` }}>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-border/70 bg-background/95">
                  {logoUrl ? (
                    <div
                      role="img"
                      aria-label={`${orgName} logo`}
                      className="h-full w-full bg-center bg-no-repeat p-3"
                      style={{
                        backgroundImage: `url("${logoUrl}")`,
                        backgroundSize: "contain",
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-muted/35 px-2 text-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-dashed border-border/70 bg-background/80 text-muted-foreground">
                        <ImageIcon className="h-4 w-4" aria-hidden />
                      </div>
                      <span className="text-[10px] leading-tight text-muted-foreground">
                        Add a logo in Brand Kit
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-[10px] font-medium tracking-[0.16em] text-muted-foreground">
                    Typography Preview
                  </p>
                  <div className="space-y-1">
                    <p
                      className="truncate text-[1.75rem] leading-none text-foreground"
                      style={titleStyle}
                    >
                      {orgName}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground" style={emailStyle}>
                      {orgTagline}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-full border border-border/60 bg-background/80 px-2 py-1 text-foreground">
                      Title · {typographyConfig.headings.family}
                    </span>
                    <span className="rounded-full border border-border/60 bg-background/80 px-2 py-1 text-foreground">
                      Email · {typographyConfig.body.family}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-4">
              <div className="rounded-[18px] border border-border/60 bg-background/80 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground" style={emailStyle}>
                  <MailIcon className="h-3.5 w-3.5" aria-hidden />
                  Sample email
                </div>
                <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-foreground" style={emailStyle}>
                  <p className="font-semibold text-foreground">{sampleEmail.subject}</p>
                  <p>{sampleEmail.greeting}</p>
                  {sampleEmail.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <p className="whitespace-pre-line">{sampleEmail.signoff}</p>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>

      <div className="mt-3 grid gap-2">
        <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-2">
          <label className="text-[11px] font-medium text-muted-foreground">Primary</label>
          <Select
            value={typographyConfig.headings.family}
            onValueChange={(value) => void updateFamily("headings", value)}
            disabled={!canEdit || typographyBusy}
          >
            <SelectTrigger className="h-8 rounded-xl bg-background/70 text-[11px]">
              <SelectValue placeholder="Select a title font" />
            </SelectTrigger>
            <SelectContent>
              {FONT_PICKER_CATEGORIES.map((category) => (
                <SelectGroup key={`heading-${category}`}>
                  <SelectLabel>{category}</SelectLabel>
                  {BRAND_FONT_OPTIONS.filter((option) => option.category === category).map(
                    (option) => (
                      <FontSelectPreviewItem
                        key={`heading-${option.id}`}
                        option={option}
                      />
                    ),
                  )}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-2">
          <label className="text-[11px] font-medium text-muted-foreground">Email</label>
          <Select
            value={typographyConfig.body.family}
            onValueChange={(value) => void updateFamily("body", value)}
            disabled={!canEdit || typographyBusy}
          >
            <SelectTrigger className="h-8 rounded-xl bg-background/70 text-[11px]">
              <SelectValue placeholder="Select an email font" />
            </SelectTrigger>
            <SelectContent>
              {FONT_PICKER_CATEGORIES.map((category) => (
                <SelectGroup key={`body-${category}`}>
                  <SelectLabel>{category}</SelectLabel>
                  {BRAND_FONT_OPTIONS.filter((option) => option.category === category).map(
                    (option) => (
                      <FontSelectPreviewItem
                        key={`body-${option.id}`}
                        option={option}
                      />
                    ),
                  )}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 px-3 py-2">
        <span className="text-[11px] text-muted-foreground">Current pairing</span>
        <span className="truncate text-[11px] text-foreground">
          {typographyConfig.headings.family} / {typographyConfig.body.family}
        </span>
      </div>
    </div>
  )
}
