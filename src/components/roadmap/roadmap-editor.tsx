"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { formatDistanceToNow } from "date-fns"
import PlusIcon from "lucide-react/dist/esm/icons/plus"
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw"
import Share2 from "lucide-react/dist/esm/icons/share-2"

import { saveRoadmapSectionAction } from "@/app/(dashboard)/strategic-roadmap/actions"
import { RichTextEditor } from "@/components/rich-text-editor"
import { RoadmapShareDrawer } from "@/components/roadmap/roadmap-share-drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import { publicSharingEnabled } from "@/lib/feature-flags"
import type { RoadmapSection } from "@/lib/roadmap"

type RoadmapEditorProps = {
  sections: RoadmapSection[]
  publicSlug: string | null
}

type RoadmapDraft = {
  id: string
  title: string
  subtitle: string
  content: string
  isPublic: boolean
  layout: RoadmapSection["layout"]
  ctaLabel?: string
  ctaUrl?: string
  slug: string
  lastUpdated: string | null
  placeholder?: string
}

const DEFAULT_PLACEHOLDER = "Start writing..."

function createDraft(section: RoadmapSection): RoadmapDraft {
  return {
    id: section.id,
    title: section.title,
    subtitle: section.subtitle ?? "",
    content: section.content ?? "",
    isPublic: section.isPublic,
    layout: section.layout ?? "square",
    ctaLabel: section.ctaLabel,
    ctaUrl: section.ctaUrl,
    slug: section.slug,
    lastUpdated: section.lastUpdated ?? null,
    placeholder: section.placeholder ?? DEFAULT_PLACEHOLDER,
  }
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `section-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function RoadmapEditor({ sections: initialSections, publicSlug }: RoadmapEditorProps) {
  const [sections, setSections] = useState<RoadmapSection[]>(() => initialSections)
  const [drafts, setDrafts] = useState<Record<string, RoadmapDraft>>(() => {
    const entries = initialSections.map((section) => [section.id, createDraft(section)] as const)
    return Object.fromEntries(entries)
  })
  const [activeId, setActiveId] = useState(initialSections[0]?.id ?? "")
  const [shareOpen, setShareOpen] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const sharingEnabled = publicSharingEnabled

  useEffect(() => {
    setSections(initialSections)
    setDrafts((prev) => {
      const next = { ...prev }
      initialSections.forEach((section) => {
        next[section.id] = createDraft(section)
      })
      return next
    })
    setActiveId((prev) => prev || initialSections[0]?.id || "")
  }, [initialSections])

  useEffect(() => {
    if (!activeId && sections.length > 0) {
      setActiveId(sections[0].id)
      return
    }

    const activeExists = sections.some((section) => section.id === activeId)
    if (!activeExists && sections.length > 0) {
      setActiveId(sections[0].id)
    }
  }, [activeId, sections])

  useEffect(() => {
    setDrafts((prev) => {
      let changed = false
      const next = { ...prev }
      sections.forEach((section) => {
        if (!next[section.id]) {
          next[section.id] = createDraft(section)
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [sections])

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeId) ?? sections[0],
    [activeId, sections],
  )

  const activeDraft = activeSection ? drafts[activeSection.id] ?? createDraft(activeSection) : null

  const statusLabel = (section: RoadmapSection) => {
    if (section.isPublic) return "Public"
    if (section.content.trim().length > 0) return "Draft"
    return "Not started"
  }

  const statusTone = (section: RoadmapSection) => {
    if (section.isPublic) return "text-emerald-600 dark:text-emerald-400"
    if (section.content.trim().length > 0) return "text-amber-600 dark:text-amber-400"
    return "text-muted-foreground"
  }

  const lastUpdatedLabel = useMemo(() => {
    if (!activeSection?.lastUpdated) return null
    try {
      return formatDistanceToNow(new Date(activeSection.lastUpdated), { addSuffix: true })
    } catch {
      return null
    }
  }, [activeSection?.lastUpdated])

  const isDirty = useMemo(() => {
    if (!activeSection || !activeDraft) return false
    return (
      activeDraft.title !== activeSection.title ||
      activeDraft.subtitle !== activeSection.subtitle ||
      activeDraft.content !== activeSection.content ||
      activeDraft.isPublic !== activeSection.isPublic
    )
  }, [activeDraft, activeSection])

  const handleDraftChange = (updates: Partial<RoadmapDraft>) => {
    if (!activeSection) return
    setDrafts((prev) => ({
      ...prev,
      [activeSection.id]: {
        ...(prev[activeSection.id] ?? createDraft(activeSection)),
        ...updates,
      },
    }))
  }

  const handleReset = () => {
    if (!activeSection) return
    setDrafts((prev) => ({
      ...prev,
      [activeSection.id]: createDraft(activeSection),
    }))
  }

  const handleSave = () => {
    if (!activeSection || !activeDraft) return
    if (!activeDraft.title.trim()) {
      toast.error("Add a section title before saving")
      return
    }
    setSavingId(activeSection.id)
    startTransition(async () => {
      const result = await saveRoadmapSectionAction({
        sectionId: activeSection.id,
        title: activeDraft.title,
        subtitle: activeDraft.subtitle,
        content: activeDraft.content,
        isPublic: activeDraft.isPublic,
      })

      if ("error" in result) {
        toast.error(result.error)
        setSavingId(null)
        return
      }

      const nextSection = result.section
      setSections((prev) => {
        const index = prev.findIndex((section) => section.id === nextSection.id)
        if (index === -1) {
          return [...prev, nextSection]
        }
        return prev.map((section, idx) => (idx === index ? nextSection : section))
      })
      setDrafts((prev) => ({
        ...prev,
        [nextSection.id]: createDraft(nextSection),
      }))
      setSavingId(null)
      toast.success("Section saved")
    })
  }

  const handleShareSave = async (updates: { layout: RoadmapSection["layout"]; ctaLabel: string; ctaUrl: string }) => {
    if (!activeSection || !activeDraft) return
    const result = await saveRoadmapSectionAction({
      sectionId: activeSection.id,
      title: activeDraft.title,
      subtitle: activeDraft.subtitle,
      content: activeDraft.content,
      isPublic: activeDraft.isPublic,
      layout: updates.layout,
      ctaLabel: updates.ctaLabel,
      ctaUrl: updates.ctaUrl,
    })

    if ("error" in result) {
      toast.error(result.error)
      return
    }

    const nextSection = result.section
    setSections((prev) => prev.map((section) => (section.id === nextSection.id ? nextSection : section)))
    setDrafts((prev) => ({
      ...prev,
      [nextSection.id]: createDraft(nextSection),
    }))
    toast.success("Share settings saved")
  }

  const handleAddSection = () => {
    const id = makeId()
    const newSection: RoadmapSection = {
      id,
      title: "New section",
      subtitle: "",
      slug: id,
      placeholder: DEFAULT_PLACEHOLDER,
      content: "",
      lastUpdated: null,
      isPublic: false,
      layout: "square",
      ctaLabel: undefined,
      ctaUrl: undefined,
    }

    setSections((prev) => [...prev, newSection])
    setDrafts((prev) => ({ ...prev, [id]: createDraft(newSection) }))
    setActiveId(id)
  }

  if (!activeSection || !activeDraft) {
    return null
  }

  const sharePath = publicSlug ? `/${publicSlug}/roadmap#${activeSection.slug}` : null

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(220px,_280px)_minmax(0,_1fr)]">
      <aside className="space-y-4 rounded-2xl border border-border/70 bg-card/70 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sections</p>
          <Button type="button" variant="outline" size="icon" onClick={handleAddSection} aria-label="Add section">
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {sections.map((section, index) => {
            const isActive = section.id === activeSection.id
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveId(section.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition",
                  isActive ? "border-border/70 bg-accent/70" : "hover:bg-accent/50",
                )}
              >
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border/70 bg-background text-[11px] font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{section.title || "Untitled section"}</p>
                  {section.subtitle ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{section.subtitle}</p>
                  ) : null}
                  <p className={cn("mt-1 text-[11px] font-semibold uppercase tracking-[0.14em]", statusTone(section))}>
                    {statusLabel(section)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        <Button type="button" variant="outline" className="w-full" onClick={handleAddSection}>
          Add section
        </Button>
      </aside>

      <section className="space-y-4 rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Section details</p>
            {lastUpdatedLabel ? <p className="text-xs text-muted-foreground">Updated {lastUpdatedLabel}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={activeDraft.isPublic}
              disabled={!publicSlug || !sharingEnabled}
              onCheckedChange={(checked) => {
                if (!sharingEnabled) {
                  toast.error("Public sharing is disabled until launch")
                  return
                }
                if (!publicSlug && checked) {
                  toast.error("Set a public slug before publishing sections")
                  return
                }
                handleDraftChange({ isPublic: checked })
              }}
              aria-label="Toggle section visibility"
            />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {activeDraft.isPublic ? "Public" : "Private"}
            </span>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="roadmap-section-title">Title</Label>
            <Input
              id="roadmap-section-title"
              value={activeDraft.title}
              onChange={(event) => handleDraftChange({ title: event.target.value })}
              placeholder="Section title"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="roadmap-section-subtitle">Subtitle</Label>
            <Input
              id="roadmap-section-subtitle"
              value={activeDraft.subtitle}
              onChange={(event) => handleDraftChange({ subtitle: event.target.value })}
              placeholder="Short supporting line"
            />
          </div>
          <div className="rounded-xl border border-border/70 bg-background/60 p-3">
            <RichTextEditor
              value={activeDraft.content}
              onChange={(value) => handleDraftChange({ content: value })}
              placeholder={activeDraft.placeholder ?? DEFAULT_PLACEHOLDER}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {!sharingEnabled
              ? "Public sharing is disabled until launch."
              : !publicSlug
                ? "Set a public slug in My Organization to enable sharing."
                : null}
            {isDirty ? <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-600">Unsaved changes</span> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleReset} disabled={!isDirty || isPending}>
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShareOpen(true)}>
              <Share2 className="mr-1 h-4 w-4" />
              Share settings
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={!isDirty || isPending}>
              {savingId === activeSection.id ? "Saving..." : "Save section"}
            </Button>
          </div>
        </div>
      </section>

      <RoadmapShareDrawer
        open={shareOpen}
        onOpenChange={setShareOpen}
        sharePath={sharePath}
        sectionTitle={activeDraft.title}
        sectionDescription={activeDraft.subtitle}
        isSectionPublic={activeDraft.isPublic}
        layout={activeDraft.layout}
        ctaLabel={activeDraft.ctaLabel}
        ctaUrl={activeDraft.ctaUrl}
        onSave={handleShareSave}
        saving={isPending}
      />
    </div>
  )
}
