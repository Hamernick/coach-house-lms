"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { formatDistanceToNowStrict } from "date-fns"
import PlusIcon from "lucide-react/dist/esm/icons/plus"
import Share2 from "lucide-react/dist/esm/icons/share-2"
import Trash2 from "lucide-react/dist/esm/icons/trash-2"

import { deleteRoadmapSectionAction, saveRoadmapSectionAction } from "@/app/(dashboard)/strategic-roadmap/actions"
import { RichTextEditor } from "@/components/rich-text-editor"
import { RoadmapShareDrawer } from "@/components/roadmap/roadmap-share-drawer"
import { RoadmapVisibilityToggle } from "@/components/roadmap/roadmap-visibility-toggle"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import type { RoadmapSection } from "@/lib/roadmap"

type RoadmapEditorProps = {
  sections: RoadmapSection[]
  publicSlug: string | null
  roadmapIsPublic: boolean
  onRoadmapPublicChange?: (next: boolean) => void
}

type RoadmapDraft = {
  id: string
  title: string
  subtitle: string
  content: string
  layout: RoadmapSection["layout"]
  ctaLabel?: string
  ctaUrl?: string
  slug: string
  lastUpdated: string | null
  placeholder?: string
}

const DEFAULT_PLACEHOLDER = "Start writing..."

function formatShortDistance(value: string | null): string | null {
  if (!value) return null
  try {
    const raw = formatDistanceToNowStrict(new Date(value))
    if (raw.includes("less than a minute")) return "1m"
    return raw
      .replace(" years", "y")
      .replace(" year", "y")
      .replace(" months", "mo")
      .replace(" month", "mo")
      .replace(" days", "d")
      .replace(" day", "d")
      .replace(" hours", "h")
      .replace(" hour", "h")
      .replace(" minutes", "m")
      .replace(" minute", "m")
      .replace(" seconds", "s")
      .replace(" second", "s")
  } catch {
    return null
  }
}

function createDraft(section: RoadmapSection): RoadmapDraft {
  return {
    id: section.id,
    title: section.title,
    subtitle: section.subtitle ?? "",
    content: section.content ?? "",
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

export function RoadmapEditor({
  sections: initialSections,
  publicSlug,
  roadmapIsPublic,
  onRoadmapPublicChange,
}: RoadmapEditorProps) {
  const [sections, setSections] = useState<RoadmapSection[]>(() => initialSections)
  const [drafts, setDrafts] = useState<Record<string, RoadmapDraft>>(() => {
    const entries = initialSections.map((section) => [section.id, createDraft(section)] as const)
    return Object.fromEntries(entries)
  })
  const [activeId, setActiveId] = useState(initialSections[0]?.id ?? "")
  const [shareOpen, setShareOpen] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [editorMinHeight, setEditorMinHeight] = useState(240)
  const sectionsListRef = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
    const element = sectionsListRef.current
    if (!element || typeof ResizeObserver === "undefined") return
    const update = (height: number) => {
      if (!Number.isFinite(height) || height <= 0) return
      setEditorMinHeight(Math.max(240, Math.round(height)))
    }
    update(element.getBoundingClientRect().height)
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => update(entry.contentRect.height))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeId) ?? sections[0],
    [activeId, sections],
  )

  const activeDraft = activeSection ? drafts[activeSection.id] ?? createDraft(activeSection) : null
  const deleteTarget = deleteTargetId ? sections.find((section) => section.id === deleteTargetId) ?? null : null
  const deleteTargetTitle = deleteTarget?.title?.trim() || "this section"

  const [lastUpdatedLabel, setLastUpdatedLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!activeSection?.lastUpdated) {
      setLastUpdatedLabel(null)
      return
    }
    setLastUpdatedLabel(formatShortDistance(activeSection.lastUpdated))
  }, [activeSection?.lastUpdated])

  const isDirty = useMemo(() => {
    if (!activeSection || !activeDraft) return false
    return (
      activeDraft.title !== activeSection.title ||
      activeDraft.subtitle !== activeSection.subtitle ||
      activeDraft.content !== activeSection.content
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

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return
    if (sections.length <= 1) {
      toast.error("At least one section is required.")
      setConfirmDeleteOpen(false)
      return
    }

    const activeIndex = sections.findIndex((section) => section.id === deleteTargetId)
    const nextActiveId = sections[activeIndex + 1]?.id ?? sections[activeIndex - 1]?.id ?? ""

    setDeletingId(deleteTargetId)
    startTransition(async () => {
      const result = await deleteRoadmapSectionAction(deleteTargetId)
      if ("error" in result) {
        toast.error(result.error)
        setDeletingId(null)
        setConfirmDeleteOpen(false)
        return
      }

      setSections((prev) => prev.filter((section) => section.id !== deleteTargetId))
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[deleteTargetId]
        return next
      })
      if (activeId === deleteTargetId) {
        setActiveId(nextActiveId)
      }
      setDeletingId(null)
      setConfirmDeleteOpen(false)
      toast.success("Section deleted")
    })
  }

  const handleShareSave = async (updates: { layout: RoadmapSection["layout"]; ctaLabel: string; ctaUrl: string }) => {
    if (!activeSection || !activeDraft) return
    const result = await saveRoadmapSectionAction({
      sectionId: activeSection.id,
      title: activeDraft.title,
      subtitle: activeDraft.subtitle,
      content: activeDraft.content,
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
    <div className="w-full lg:grid lg:min-w-0 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start lg:justify-items-stretch lg:gap-6">
      <aside className="hidden lg:flex lg:min-w-0 lg:flex-col lg:gap-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sections</p>
          <Button type="button" variant="ghost" size="sm" onClick={handleAddSection} className="gap-1">
            <PlusIcon className="h-4 w-4" />
            New
          </Button>
        </div>

        <div ref={sectionsListRef} className="min-w-0 space-y-1">
          {sections.map((section, index) => {
            const isActive = section.id === activeSection.id
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveId(section.id)}
                className={cn(
                  "flex w-full min-w-0 items-start gap-2.5 rounded-lg px-2 py-2 text-left transition",
                  isActive ? "bg-accent/70 text-foreground" : "text-muted-foreground hover:bg-accent/50",
                )}
              >
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/70 bg-background text-[10px] font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {section.title || "Untitled section"}
                  </p>
                  {section.subtitle ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">{section.subtitle}</p>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="w-full min-w-0 space-y-5 lg:justify-self-stretch">
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sections</p>
          <Button type="button" variant="ghost" size="sm" onClick={handleAddSection} className="gap-1">
            <PlusIcon className="h-4 w-4" />
            New
          </Button>
        </div>

        <div className="lg:hidden">
          <Select
            value={activeSection?.id ?? ""}
            onValueChange={(value) => {
              if (value) setActiveId(value)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((section, index) => (
                <SelectItem key={section.id} value={section.id}>
                  {index + 1}. {section.title || "Untitled section"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Section details</p>
          <RoadmapVisibilityToggle
            initialPublic={roadmapIsPublic}
            publicSlug={publicSlug}
            onPublicChange={onRoadmapPublicChange}
          />
        </div>

        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label htmlFor="roadmap-section-title" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Title
            </Label>
            <Input
              id="roadmap-section-title"
              value={activeDraft.title}
              onChange={(event) => handleDraftChange({ title: event.target.value })}
              placeholder="Section title"
              className="text-base font-semibold"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="roadmap-section-subtitle" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Subtitle
            </Label>
            <Input
              id="roadmap-section-subtitle"
              value={activeDraft.subtitle}
              onChange={(event) => handleDraftChange({ subtitle: event.target.value })}
              placeholder="Subtitle (optional)"
            />
          </div>
        </div>

        <div className="space-y-2">
          <RichTextEditor
            value={activeDraft.content}
            onChange={(value) => handleDraftChange({ content: value })}
            placeholder={activeDraft.placeholder ?? DEFAULT_PLACEHOLDER}
            minHeight={editorMinHeight}
            stableScrollbars
          />
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              {lastUpdatedLabel ? (
                <div className="text-xs text-muted-foreground">Updated {lastUpdatedLabel} ago</div>
              ) : null}
              {isDirty ? (
                <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-600">
                  Unsaved changes
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setShareOpen(true)}>
                <Share2 className="mr-1 h-4 w-4" />
                Share settings
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDeleteTargetId(activeSection.id)
                  setConfirmDeleteOpen(true)
                }}
                disabled={sections.length <= 1 || isPending || deletingId === activeSection.id}
                className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                {deletingId === activeSection.id ? "Deleting..." : "Delete"}
              </Button>
              <Button type="button" onClick={handleSave} disabled={!isDirty || isPending}>
                {savingId === activeSection.id ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <RoadmapShareDrawer
        open={shareOpen}
        onOpenChange={setShareOpen}
        sharePath={sharePath}
        sectionTitle={activeDraft.title}
        sectionDescription={activeDraft.subtitle}
        roadmapIsPublic={roadmapIsPublic}
        layout={activeDraft.layout}
        ctaLabel={activeDraft.ctaLabel}
        ctaUrl={activeDraft.ctaUrl}
        onSave={handleShareSave}
        saving={isPending}
      />

      <AlertDialog
        open={confirmDeleteOpen}
        onOpenChange={(open) => {
          setConfirmDeleteOpen(open)
          if (!open) {
            setDeleteTargetId(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete section?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{deleteTargetTitle}&quot; and its content from your roadmap.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
              disabled={Boolean(deletingId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
