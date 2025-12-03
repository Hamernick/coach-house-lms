"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { formatDistanceToNow } from "date-fns"
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw"

import { saveRoadmapSectionAction } from "@/app/(dashboard)/strategic-roadmap/actions"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/lib/toast"
import type { RoadmapSection } from "@/lib/roadmap"
import { RoadmapShareDrawer } from "@/components/roadmap/roadmap-share-drawer"

export function RoadmapSectionEditor({ section, publicSlug }: { section: RoadmapSection; publicSlug: string | null }) {
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
    return `/org/${publicSlug}/roadmap#${section.slug}`
  }, [publicSlug, section.slug])

  const handleSave = () => {
    if (!isDirty) return
    startTransition(async () => {
      const result = await saveRoadmapSectionAction({
        sectionId: section.id,
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
      startShareTransition(async () => {
        const result = await saveRoadmapSectionAction({
          sectionId: section.id,
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
        setDraft(result.section.content)
        setLastUpdated(result.section.lastUpdated)
        setIsSectionPublic(result.section.isPublic)
        setSavedPublic(result.section.isPublic)
        setShareLayout(result.section.layout)
        setShareCtaLabel(result.section.ctaLabel ?? "Learn more")
        setShareCtaUrl(result.section.ctaUrl ?? "")
        toast.success("Share settings saved")
      })
    },
    [isSectionPublic, savedValue, section.id],
  )

  const handleReset = () => {
    if (!isDirty || isPending) return
    setDraft(savedValue)
    setIsSectionPublic(savedPublic)
  }

  return (
    <Card className="overflow-hidden border border-border/60 bg-card/70 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 px-3 py-1.5">
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
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {isSectionPublic ? "Public" : "Hidden"}
            </span>
          </div>
        </div>
        {lastUpdatedLabel ? (
          <p className="text-xs text-muted-foreground">Last updated {lastUpdatedLabel}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Draft not published yet</p>
        )}
        {!publicSlug ? (
          <p className="text-xs text-amber-600">
            Add a public slug on My Organization before sharing this section.
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        <RichTextEditor
          value={draft}
          onChange={setDraft}
          placeholder={section.placeholder ?? "Start writing..."}
        />
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/20 py-4">
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
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setShareOpen(true)}>
            Share
          </Button>
          <Button type="button" disabled={!isDirty || isPending} onClick={handleSave}>
            {isPending ? "Saving…" : "Save section"}
          </Button>
        </div>
      </CardFooter>
      <RoadmapShareDrawer
        open={shareOpen}
        onOpenChange={setShareOpen}
        sharePath={sharePath}
        sectionTitle={section.title}
        sectionDescription={section.description}
        isSectionPublic={isSectionPublic}
        layout={shareLayout}
        ctaLabel={shareCtaLabel}
        ctaUrl={shareCtaUrl}
        onSave={handleShareSave}
        saving={shareSaving}
      />
    </Card>
  )
}
