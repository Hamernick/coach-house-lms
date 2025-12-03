"use client"

import { useEffect, useMemo, useState } from "react"
import CopyIcon from "lucide-react/dist/esm/icons/copy"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"

import { NewsGradientThumb, getNewsGradientPalette } from "@/components/news/gradient-thumb"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/lib/toast"

const LAYOUT_OPTIONS = [
  { id: "square", label: "Square", description: "Best for feed posts", aspectClass: "aspect-square" },
  { id: "vertical", label: "Vertical", description: "Great for stories", aspectClass: "aspect-[3/4]" },
  { id: "wide", label: "Wide", description: "Use for hero banners", aspectClass: "aspect-[16/9]" },
]

type RoadmapShareDrawerProps = {
  open: boolean
  onOpenChange: (next: boolean) => void
  sharePath: string | null
  sectionTitle: string
  sectionDescription?: string
  isSectionPublic: boolean
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
  isSectionPublic,
  layout,
  ctaLabel,
  ctaUrl,
  onSave,
  saving = false,
}: RoadmapShareDrawerProps) {
  const [localLayout, setLocalLayout] = useState(layout)
  const [localCtaLabel, setLocalCtaLabel] = useState(ctaLabel ?? "Learn more")
  const [localCtaUrl, setLocalCtaUrl] = useState(ctaUrl ?? "")
  const [downloadPending, setDownloadPending] = useState(false)

  useEffect(() => {
    setLocalLayout(layout)
  }, [layout])

  useEffect(() => {
    setLocalCtaLabel(ctaLabel ?? "Learn more")
  }, [ctaLabel])

  useEffect(() => {
    setLocalCtaUrl(ctaUrl ?? "")
  }, [ctaUrl])

  const shareTarget = useMemo(() => {
    if (!sharePath) return null
    if (typeof window !== "undefined" && window.location) {
      return `${window.location.origin}${sharePath}`
    }
    return sharePath
  }, [sharePath])

  const handleCopy = async () => {
    if (!shareTarget) {
      toast.error("Set a public slug to generate a share link")
      return
    }
    if (!isSectionPublic) {
      toast.error("Publish this section to share it publicly")
      return
    }
    try {
      await navigator.clipboard.writeText(shareTarget)
      toast.success("Roadmap link copied to clipboard")
    } catch {
      toast.error("Unable to copy link")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Share “{sectionTitle}”</SheetTitle>
          <SheetDescription>
            Configure how this section should show up in social posts. Layout + CTA updates are saved to your roadmap so future cards match automatically.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Layout</Label>
            <Tabs value={localLayout} onValueChange={(value) => setLocalLayout(value as typeof localLayout)} className="w-full">
              <TabsList className="grid grid-cols-3">
                {LAYOUT_OPTIONS.map((option) => (
                  <TabsTrigger key={option.id} value={option.id} className="flex flex-col gap-1 text-xs">
                    {option.label}
                    <span className="text-[10px] text-muted-foreground">{option.description}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {LAYOUT_OPTIONS.map((option) => (
                <TabsContent key={option.id} value={option.id} className="mt-3">
                  <Card className="overflow-hidden border border-border/60 bg-card/70 p-4 text-sm text-muted-foreground shadow-sm">
                    <div className={`${option.aspectClass} relative rounded-2xl border border-border/40 bg-muted/30`}>
                      <NewsGradientThumb seed={`${sectionTitle}-${option.id}`} className="absolute inset-0 rounded-2xl" />
                      <div className="absolute inset-0 flex flex-col justify-between rounded-2xl bg-gradient-to-b from-black/20 via-black/70 to-black/80 p-4 text-white">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">Strategic Roadmap</p>
                          <p className="mt-2 text-lg font-semibold leading-snug">{sectionTitle}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-white/80">{sectionDescription || "Preview of your section summary."}</p>
                        </div>
                        <Button type="button" size="sm" className="self-start rounded-full bg-white/90 text-xs font-semibold text-black">
                          {localCtaLabel}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Call to action</Label>
            <div className="grid gap-3">
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
                  Optional link
                </Label>
                <Input
                  id="roadmap-cta-url"
                  placeholder="https://"
                  value={localCtaUrl}
                  onChange={(event) => setLocalCtaUrl(event.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              CTA settings aren&apos;t published yet—they help you plan upcoming posts and will power auto-generated graphics in a future release.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-xs text-muted-foreground">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <SparklesIcon className="h-4 w-4 text-primary" />
              Coming soon
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Download PNG previews sized for each layout.</li>
              <li>Auto-generated captions from your roadmap content.</li>
              <li>Schedule share reminders before major milestones.</li>
            </ul>
          </div>
        </div>
        <SheetFooter className="mt-6 flex flex-col gap-3">
          <Button
            type="button"
            onClick={() =>
        onSave({
          layout: localLayout,
          ctaLabel: localCtaLabel,
          ctaUrl: localCtaUrl,
        })
      }
      disabled={saving}
      className="justify-center"
    >
      {saving ? "Saving…" : "Save share settings"}
    </Button>
    <Button
      type="button"
      variant="outline"
      disabled={downloadPending || !isSectionPublic}
      onClick={async () => {
        if (!isSectionPublic) {
          toast.error("Publish this section before downloading a card")
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
      {downloadPending ? "Generating…" : "Download preview"}
    </Button>
          {!sharePath ? (
            <p className="text-sm text-amber-600">
              Add a public slug on My Organization to generate a shareable link.
            </p>
          ) : !isSectionPublic ? (
            <p className="text-sm text-amber-600">Publish this section (toggle in the editor) to unlock sharing.</p>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 px-3 py-2">
              <code className="flex-1 truncate text-sm">{shareTarget}</code>
              <Button type="button" size="sm" variant="outline" className="gap-2" onClick={handleCopy}>
                <CopyIcon className="h-3.5 w-3.5" />
                Copy
              </Button>
            </div>
          )}
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
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
