"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { formatDistanceToNow } from "date-fns"
import { Globe2, Lock, PencilLine, RotateCcw, Share2 } from "lucide-react"

import { saveRoadmapSectionAction } from "@/app/(dashboard)/strategic-roadmap/actions"
import { RichTextEditor } from "@/components/rich-text-editor"
import { RoadmapShareDrawer } from "@/components/roadmap/roadmap-share-drawer"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import type { RoadmapSection } from "@/lib/roadmap"

type RoadmapSectionEditorProps = {
  section: RoadmapSection
  publicSlug: string | null
  index: number
}

export function RoadmapSectionEditor({ section, publicSlug, index }: RoadmapSectionEditorProps) {
  const [draft, setDraft] = useState(section.content ?? "")
  const [savedValue, setSavedValue] = useState(section.content ?? "")
  const [lastUpdated, setLastUpdated] = useState(section.lastUpdated ?? null)
  const [isSectionPublic, setIsSectionPublic] = useState(section.isPublic)
  const [savedPublic, setSavedPublic] = useState(section.isPublic)
  const [isPending, startTransition] = useTransition()
  const [shareOpen, setShareOpen] = useState(false)
  const [shareLayout, setShareLayout] = useState<RoadmapSection["layout"]>(section.layout ?? "square")
  const [shareCtaLabel, setShareCtaLabel] = useState<string>(section.ctaLabel ?? "Learn more")
  const [shareCtaUrl, setShareCtaUrl] = useState<string>(section.ctaUrl ?? "")
  const [shareSaving, startShareTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    setDraft(section.content ?? "")
    setSavedValue(section.content ?? "")
    setLastUpdated(section.lastUpdated ?? null)
    setIsSectionPublic(section.isPublic)
    setSavedPublic(section.isPublic)
    setShareLayout(section.layout ?? "square")
    setShareCtaLabel(section.ctaLabel ?? "Learn more")
    setShareCtaUrl(section.ctaUrl ?? "")
  }, [section.content, section.id, section.isPublic, section.lastUpdated, section.layout, section.ctaLabel, section.ctaUrl])

  const isDirty = draft !== savedValue || isSectionPublic !== savedPublic

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) return null
    try {
      return formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })
    } catch {
      return null
    }
  }, [lastUpdated])

  const sharePath = useMemo(() => {
    if (!publicSlug) return null
    return `/${publicSlug}/roadmap#${section.slug}`
  }, [publicSlug, section.slug])

  const previewText = useMemo(() => {
    if (!savedValue) return null
    return stripHtml(savedValue).slice(0, 220)
  }, [savedValue])

  const statusLabel = isSectionPublic ? "Public" : savedValue ? "Draft" : "Not started"
  const statusIcon = isSectionPublic ? Globe2 : savedValue ? PencilLine : Lock

  const handleSave = () => {
    if (!isDirty) return
    startTransition(async () => {
      const result = await saveRoadmapSectionAction({
        sectionId: section.id,
        title: section.title,
        subtitle: section.subtitle,
        content: draft,
        isPublic: isSectionPublic,
      })
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(`${section.title} updated`)
      setSavedValue(result.section.content)
      setDraft(result.section.content)
      setLastUpdated(result.section.lastUpdated)
      setSavedPublic(result.section.isPublic)
      setIsSectionPublic(result.section.isPublic)
      setShareLayout(result.section.layout)
      setShareCtaLabel(result.section.ctaLabel ?? "Learn more")
      setShareCtaUrl(result.section.ctaUrl ?? "")
    })
  }

  const handleShareSave = useCallback(
    (next: { layout: RoadmapSection["layout"]; ctaLabel: string; ctaUrl: string }) => {
      const shouldSyncDraft = draft === savedValue
      startShareTransition(async () => {
        const result = await saveRoadmapSectionAction({
          sectionId: section.id,
          title: section.title,
          subtitle: section.subtitle,
          content: savedValue,
          isPublic: isSectionPublic,
          layout: next.layout,
          ctaLabel: next.ctaLabel,
          ctaUrl: next.ctaUrl,
        })
        if ("error" in result) {
          toast.error(result.error)
          return
        }
        setSavedValue(result.section.content)
        if (shouldSyncDraft) {
          setDraft(result.section.content)
        }
        setLastUpdated(result.section.lastUpdated)
        setIsSectionPublic(result.section.isPublic)
        setSavedPublic(result.section.isPublic)
        setShareLayout(result.section.layout)
        setShareCtaLabel(result.section.ctaLabel ?? "Learn more")
        setShareCtaUrl(result.section.ctaUrl ?? "")
        toast.success("Share settings saved")
      })
    },
    [draft, isSectionPublic, savedValue, section.id],
  )

  const handleReset = () => {
    if (!isDirty || isPending) return
    setDraft(savedValue)
    setIsSectionPublic(savedPublic)
  }

  return (
    <li className="relative z-10 pl-10">
      <span
        className={cn(
          "absolute left-0 top-2.5 flex h-6 w-6 items-center justify-center rounded-full border bg-card text-[11px] font-semibold tabular-nums",
          isSectionPublic
            ? "border-emerald-500/60 text-emerald-700 dark:text-emerald-400"
            : savedValue
              ? "border-amber-500/60 text-amber-700 dark:text-amber-400"
              : "border-border/70 text-muted-foreground",
        )}
        aria-hidden
      >
        {index}
      </span>
      <div className="relative rounded-2xl border border-border/70 bg-background/60 p-4 pr-12">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-3 top-3"
              aria-label={previewText ? "Edit section" : "Start section"}
              title={previewText ? "Edit section" : "Start section"}
            >
              <PencilLine className="h-4 w-4" aria-hidden />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{section.title}</DialogTitle>
              <DialogDescription>{section.subtitle}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Visibility</p>
                  <p className="text-xs text-muted-foreground">
                    {publicSlug ? "Toggle public visibility for this section." : "Set a public slug in My Organization to publish this section."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isSectionPublic}
                    disabled={!publicSlug || isPending}
                    onCheckedChange={(checked) => {
                      if (!publicSlug) {
                        toast.error("Set a public slug before publishing sections")
                        return
                      }
                      setIsSectionPublic(checked)
                    }}
                    aria-label="Toggle section visibility"
                  />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {isSectionPublic ? "Public" : "Hidden"}
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-border/70 bg-card/60 p-3">
                <RichTextEditor value={draft} onChange={setDraft} placeholder={section.placeholder ?? "Start writing..."} />
              </div>
            </div>
            <DialogFooter className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!isDirty || isPending}
                  className="gap-1 text-muted-foreground"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShareOpen(true)}>
                  <Share2 className="mr-1 h-4 w-4" />
                  Share settings
                </Button>
              </div>
              <Button type="button" disabled={!isDirty || isPending} onClick={handleSave}>
                {isPending ? "Saving…" : "Save section"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
            <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <StatusIcon icon={statusIcon} />
              {statusLabel}
            </div>
            {lastUpdatedLabel ? <span className="text-[11px] text-muted-foreground">Updated {lastUpdatedLabel}</span> : null}
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground">{section.title}</p>
            <p className="text-sm text-muted-foreground">{section.subtitle}</p>
          </div>
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            {previewText ? (
              <span className="line-clamp-2 leading-relaxed">{previewText}</span>
            ) : (
              <span className="italic text-muted-foreground/80">
                Not started yet. Pull a few crisp sentences from your lesson notes to make this section share-ready.
              </span>
            )}
          </div>
        </div>
      </div>
      <RoadmapShareDrawer
        open={shareOpen}
        onOpenChange={setShareOpen}
        sharePath={sharePath}
        sectionTitle={section.title}
        sectionDescription={section.subtitle}
        isSectionPublic={isSectionPublic}
        layout={shareLayout}
        ctaLabel={shareCtaLabel}
        ctaUrl={shareCtaUrl}
        onSave={handleShareSave}
        saving={shareSaving}
      />
    </li>
  )
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

function StatusIcon({ icon: Icon }: { icon: typeof Globe2 }) {
  return <Icon className="h-3.5 w-3.5" aria-hidden />
}
