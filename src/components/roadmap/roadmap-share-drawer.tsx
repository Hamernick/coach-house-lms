"use client"

import { useEffect, useState } from "react"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import CopyIcon from "lucide-react/dist/esm/icons/copy"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"

import { NewsGradientThumb, getNewsGradientPalette } from "@/components/news/gradient-thumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "@/lib/toast"
import { publicSharingEnabled } from "@/lib/feature-flags"

const LAYOUT_OPTIONS = [
  { id: "square", label: "Square", description: "Best for feed posts", aspectClass: "aspect-square" },
  { id: "vertical", label: "Vertical", description: "Great for stories", aspectClass: "aspect-[3/4]" },
  { id: "wide", label: "Wide", description: "Use for hero banners", aspectClass: "aspect-[16/9]" },
]

const DEFAULT_CTA_LABEL = "Learn more"

type RoadmapShareDrawerProps = {
  open: boolean
  onOpenChange: (next: boolean) => void
  sharePath: string | null
  sectionTitle: string
  sectionDescription?: string
  roadmapIsPublic: boolean
  layout: "square" | "vertical" | "wide"
  ctaLabel?: string
  ctaUrl?: string
  onSave: (next: { layout: "square" | "vertical" | "wide"; ctaLabel: string; ctaUrl: string }) => Promise<void> | void
  saving?: boolean
}

export function RoadmapShareDrawer({
  open,
  onOpenChange,
  sharePath,
  sectionTitle,
  sectionDescription,
  roadmapIsPublic,
  layout,
  ctaLabel,
  ctaUrl,
  onSave,
  saving = false,
}: RoadmapShareDrawerProps) {
  const [localLayout, setLocalLayout] = useState(layout)
  const [localCtaLabel, setLocalCtaLabel] = useState(ctaLabel ?? DEFAULT_CTA_LABEL)
  const [localCtaUrl, setLocalCtaUrl] = useState(ctaUrl ?? "")
  const [downloadPending, setDownloadPending] = useState(false)
  const [copied, setCopied] = useState(false)
  const sharingEnabled = publicSharingEnabled

  useEffect(() => {
    setLocalLayout(layout)
  }, [layout])

  useEffect(() => {
    setLocalCtaLabel(ctaLabel ?? DEFAULT_CTA_LABEL)
  }, [ctaLabel])

  useEffect(() => {
    setLocalCtaUrl(ctaUrl ?? "")
  }, [ctaUrl])

  const initialLabel = ctaLabel ?? DEFAULT_CTA_LABEL
  const initialUrl = ctaUrl ?? ""
  const isDirty = localLayout !== layout || localCtaLabel !== initialLabel || localCtaUrl !== initialUrl

  const layoutMeta =
    LAYOUT_OPTIONS.find((option) => option.id === localLayout) ?? LAYOUT_OPTIONS[0]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="text-left">
          <SheetTitle>Share settings</SheetTitle>
          <SheetDescription>{sectionTitle}</SheetDescription>
        </SheetHeader>
        <div className="mt-5 flex-1 space-y-6 overflow-y-auto px-4 pb-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Share card
              </Label>
              <ToggleGroup
                type="single"
                value={localLayout}
                onValueChange={(value) => {
                  if (value) setLocalLayout(value as typeof localLayout)
                }}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                {LAYOUT_OPTIONS.map((option) => (
                  <ToggleGroupItem key={option.id} value={option.id} className="px-2.5 text-[11px]">
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/40 p-3">
              <div className={`${layoutMeta.aspectClass} relative overflow-hidden rounded-xl border border-border/50 bg-muted/20`}>
                <NewsGradientThumb seed={`${sectionTitle}-${layoutMeta.id}`} className="absolute inset-0 rounded-xl" />
                <div className="absolute inset-0 flex flex-col justify-between rounded-xl bg-gradient-to-b from-black/10 via-black/55 to-black/70 p-3 text-white">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/70">Strategic Roadmap</p>
                    <p className="mt-2 text-base font-semibold leading-snug">{sectionTitle}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-white/80">
                      {sectionDescription || "Preview of your section summary."}
                    </p>
                  </div>
                  <Button type="button" size="sm" className="self-start rounded-full bg-white/90 text-[11px] font-semibold text-black">
                    {localCtaLabel || DEFAULT_CTA_LABEL}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">CTA</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="roadmap-cta-label" className="text-xs text-muted-foreground">
                  Button label
                </Label>
                <Input
                  id="roadmap-cta-label"
                  value={localCtaLabel}
                  onChange={(event) => setLocalCtaLabel(event.target.value.slice(0, 32))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="roadmap-cta-url" className="text-xs text-muted-foreground">
                  Link (optional)
                </Label>
                <Input
                  id="roadmap-cta-url"
                  placeholder="https://"
                  value={localCtaUrl}
                  onChange={(event) => setLocalCtaUrl(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Public link
            </Label>
            {sharePath && roadmapIsPublic && sharingEnabled ? (
              <div className="flex flex-wrap items-center gap-2">
                <Input value={sharePath} readOnly className="flex-1 text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Copy public link"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(sharePath)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    } catch {
                      toast.error("Unable to copy link")
                    }
                  }}
                >
                  {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                </Button>
                <Button asChild type="button" variant="outline" size="icon" aria-label="View public section">
                  <a href={sharePath} target="_blank" rel="noreferrer">
                    <ExternalLinkIcon className="h-4 w-4" aria-hidden />
                  </a>
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {!sharingEnabled
                  ? "Public sharing is disabled until launch."
                  : !sharePath
                    ? "Set a public slug to generate a share link."
                    : "Make the roadmap public to view this section."}
              </p>
            )}
          </div>
        </div>

        <SheetFooter className="border-t border-border/60 bg-background/80 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={downloadPending || !roadmapIsPublic}
            onClick={async () => {
              if (!roadmapIsPublic) {
                toast.error("Make the roadmap public before downloading a card")
                return
              }
              setDownloadPending(true)
              try {
                const url = await renderShareCardImage({
                  title: sectionTitle,
                  description: sectionDescription ?? "",
                  layout: localLayout,
                  ctaLabel: localCtaLabel,
                  paletteSeed: sectionTitle,
                })
                const link = document.createElement("a")
                link.href = url
                link.download = `${sectionTitle.replace(/\s+/g, "-").toLowerCase()}-${localLayout}.png`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                toast.success("Share card downloaded")
              } catch (error) {
                console.error(error)
                toast.error("Unable to generate card — try again")
              } finally {
                setDownloadPending(false)
              }
            }}
            className="gap-2"
          >
            <DownloadIcon className="h-4 w-4" />
            {downloadPending ? "Generating…" : "Download"}
          </Button>
          <Button
            type="button"
            disabled={saving || !isDirty}
            onClick={() => {
              if (!isDirty) return
              onSave({
                layout: localLayout,
                ctaLabel: localCtaLabel,
                ctaUrl: localCtaUrl,
              })
            }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

type RenderShareCardArgs = {
  title: string
  description: string
  layout: "square" | "vertical" | "wide"
  ctaLabel: string
  paletteSeed: string
}

const SHARE_SIZES: Record<RenderShareCardArgs["layout"], { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  vertical: { width: 1080, height: 1440 },
  wide: { width: 1280, height: 720 },
}

async function renderShareCardImage({ title, description, layout, ctaLabel, paletteSeed }: RenderShareCardArgs): Promise<string> {
  const { width, height } = SHARE_SIZES[layout]
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Canvas unavailable")
  }

  const palette = getNewsGradientPalette(paletteSeed)
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, palette[0])
  gradient.addColorStop(0.3, palette[1])
  gradient.addColorStop(0.6, palette[2])
  gradient.addColorStop(1, palette[3])
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  const overlayGradient = ctx.createLinearGradient(0, height * 0.3, 0, height)
  overlayGradient.addColorStop(0, "rgba(0,0,0,0)")
  overlayGradient.addColorStop(1, "rgba(0,0,0,0.6)")
  ctx.fillStyle = overlayGradient
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = "rgba(0,0,0,0.25)"
  ctx.filter = "blur(30px)"
  ctx.beginPath()
  ctx.arc(width * 0.2, height * 0.25, 180, 0, Math.PI * 2)
  ctx.arc(width * 0.8, height * 0.1, 160, 0, Math.PI * 2)
  ctx.closePath()
  ctx.fill()
  ctx.filter = "none"

  ctx.fillStyle = "rgba(255,255,255,0.2)"
  ctx.font = "700 26px 'Inter', sans-serif"
  ctx.textBaseline = "top"
  ctx.fillText("STRATEGIC ROADMAP", 80, 80)

  ctx.fillStyle = "#fff"
  wrapText(ctx, title, 80, 130, width - 160, 64, "700 64px 'Inter', sans-serif")

  const summary = truncate(stripHtml(description), 220)
  ctx.fillStyle = "rgba(255,255,255,0.9)"
  wrapText(ctx, summary || "Your story, mission, and next steps in one place.", 80, height * 0.45, width - 160, 38, "400 36px 'Inter', sans-serif")

  const buttonWidth = ctx.measureText(ctaLabel).width + 48
  const buttonHeight = 72
  const buttonX = 80
  const buttonY = height - buttonHeight - 96
  ctx.fillStyle = "rgba(255,255,255,0.92)"
  roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 999)
  ctx.fillStyle = "#111"
  ctx.font = "600 28px 'Inter', sans-serif"
  ctx.textBaseline = "middle"
  ctx.fillText(ctaLabel, buttonX + 24, buttonY + buttonHeight / 2)

  return canvas.toDataURL("image/png", 0.92)
}

function stripHtml(value: string): string {
  if (!value) return ""
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
}

function truncate(value: string, max: number): string {
  if (!value) return ""
  return value.length > max ? `${value.slice(0, max)}…` : value
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  font: string,
) {
  ctx.font = font
  const words = text.split(" ")
  let line = ""
  for (let n = 0; n < words.length; n += 1) {
    const testLine = line ? `${line} ${words[n]}` : words[n]
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y)
      line = words[n]
      y += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, y)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, height / 2, width / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  ctx.fill()
}
