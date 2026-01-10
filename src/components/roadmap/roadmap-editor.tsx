"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { formatDistanceToNowStrict } from "date-fns"
import PlusIcon from "lucide-react/dist/esm/icons/plus"
import Share2 from "lucide-react/dist/esm/icons/share-2"
import Trash2 from "lucide-react/dist/esm/icons/trash-2"
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal"
import CheckIcon from "lucide-react/dist/esm/icons/check"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { uploadOrgMedia, validateOrgMediaFile } from "@/lib/organization/org-media"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import type { RoadmapSection } from "@/lib/roadmap"

type RoadmapEditorProps = {
  sections: RoadmapSection[]
  publicSlug: string | null
  roadmapIsPublic: boolean
  onRoadmapPublicChange?: (next: boolean) => void
  onDirtyChange?: (dirty: boolean) => void
  onRegisterDiscard?: (handler: (() => void) | null) => void
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
const ROADMAP_DRAFT_STORAGE_VERSION = 1

type RoadmapDraftStorage = {
  version: number
  updatedAt: string
  drafts: Record<string, { title?: string; subtitle?: string; content?: string }>
}

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
  onDirtyChange,
  onRegisterDiscard,
}: RoadmapEditorProps) {
  const storageKey = useMemo(
    () => `roadmap-draft:${publicSlug ?? "private"}`,
    [publicSlug],
  )
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
    setDrafts(() => {
      const next = Object.fromEntries(initialSections.map((section) => [section.id, createDraft(section)] as const))
      if (typeof window === "undefined") return next
      try {
        const raw = window.localStorage.getItem(storageKey)
        if (!raw) return next
        const parsed = JSON.parse(raw) as RoadmapDraftStorage
        if (parsed?.version !== ROADMAP_DRAFT_STORAGE_VERSION || !parsed.drafts) return next
        initialSections.forEach((section) => {
          const draft = parsed.drafts[section.id]
          if (!draft) return
          next[section.id] = {
            ...next[section.id],
            title: draft.title ?? next[section.id].title,
            subtitle: draft.subtitle ?? next[section.id].subtitle,
            content: draft.content ?? next[section.id].content,
          }
        })
      } catch {
        return next
      }
      return next
    })
    setActiveId((prev) => prev || initialSections[0]?.id || "")
  }, [initialSections, storageKey])

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
  const activeIndex = Math.max(
    0,
    sections.findIndex((section) => section.id === activeSection?.id),
  )
  const sectionProgress =
    sections.length > 1 ? Math.round((activeIndex / (sections.length - 1)) * 100) : 0

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

  const hasUnsavedChanges = useMemo(
    () =>
      sections.some((section) => {
        const draft = drafts[section.id]
        if (!draft) return false
        return (
          draft.title !== section.title ||
          draft.subtitle !== (section.subtitle ?? "") ||
          draft.content !== (section.content ?? "")
        )
      }),
    [sections, drafts],
  )

  const discardDrafts = useCallback(() => {
    setDrafts(() => {
      const entries = sections.map((section) => [section.id, createDraft(section)] as const)
      return Object.fromEntries(entries)
    })
  }, [sections])

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges)
  }, [hasUnsavedChanges, onDirtyChange])

  useEffect(() => {
    onRegisterDiscard?.(discardDrafts)
    return () => onRegisterDiscard?.(null)
  }, [onRegisterDiscard, discardDrafts])

  useEffect(() => {
    if (typeof window === "undefined") return
    const payload: RoadmapDraftStorage = {
      version: ROADMAP_DRAFT_STORAGE_VERSION,
      updatedAt: new Date().toISOString(),
      drafts: {},
    }
    sections.forEach((section) => {
      const draft = drafts[section.id]
      if (!draft) return
      if (
        draft.title !== section.title ||
        draft.subtitle !== (section.subtitle ?? "") ||
        draft.content !== (section.content ?? "")
      ) {
        payload.drafts[section.id] = {
          title: draft.title,
          subtitle: draft.subtitle,
          content: draft.content,
        }
      }
    })
    if (Object.keys(payload.drafts).length === 0) {
      window.localStorage.removeItem(storageKey)
      return
    }
    window.localStorage.setItem(storageKey, JSON.stringify(payload))
  }, [drafts, sections, storageKey])

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

  const handleImageUpload = useCallback(async (file: File) => {
    const error = validateOrgMediaFile(file)
    if (error) {
      throw new Error(error)
    }
    return uploadOrgMedia({ file, kind: "roadmap" })
  }, [uploadOrgMedia, validateOrgMediaFile])

  if (!activeSection || !activeDraft) {
    return null
  }

  const sharePath = publicSlug ? `/${publicSlug}/roadmap#${activeSection.slug}` : null

  return (
    <div className="w-full lg:grid lg:min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,44rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
      <aside className="hidden lg:col-start-1 lg:col-end-2 lg:flex lg:min-w-0 lg:flex-col lg:gap-3 lg:justify-self-end lg:w-[17rem] lg:pr-4 lg:-translate-x-4 xl:pr-8 xl:-translate-x-6">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sections</p>
          <Button type="button" variant="ghost" size="sm" onClick={handleAddSection} className="gap-1">
            <PlusIcon className="h-4 w-4" />
            New
          </Button>
        </div>

        <div
          ref={sectionsListRef}
          className="relative min-w-0 space-y-2"
          style={{ ["--dot-size" as string]: "32px" }}
        >
          <div className="absolute left-[calc(var(--dot-size)/2)] top-[calc(var(--dot-size)/2)] bottom-[calc(var(--dot-size)/2)] w-px -translate-x-1/2 bg-border/60">
            <div
              className="w-full rounded-full bg-gradient-to-b from-purple-500 via-blue-500 to-sky-400 transition-[height] duration-300 ease-out"
              style={{ height: `${sectionProgress}%` }}
            />
          </div>
          {sections.map((section, index) => {
            const isActive = section.id === activeSection.id
            const status: "complete" | "in_progress" | "not_started" =
              index < activeIndex ? "complete" : isActive ? "in_progress" : "not_started"
            const styles =
              status === "complete"
                ? {
                    border: "border-emerald-500",
                    text: "text-emerald-500",
                    icon: <CheckIcon className="h-4 w-4" />,
                    dashed: false,
                  }
                : status === "in_progress"
                  ? {
                      border: "border-amber-500",
                      text: "text-amber-500",
                      icon: <span className="text-[11px] font-semibold">{index + 1}</span>,
                      dashed: true,
                    }
                  : {
                      border: "border-muted-foreground/60",
                      text: "text-muted-foreground",
                      icon: <span className="text-[11px] font-semibold">{index + 1}</span>,
                      dashed: false,
                    }
            return (
              <div key={section.id} className="group flex min-w-0 items-start gap-2">
                <button
                  type="button"
                  onClick={() => setActiveId(section.id)}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex min-w-0 flex-1 items-start gap-3 rounded-xl px-2 py-2 text-left transition",
                    isActive ? "bg-accent/70 text-foreground" : "text-muted-foreground hover:bg-accent/50",
                  )}
                >
                  <span
                    className={cn(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-background",
                      styles.border,
                      status === "not_started" && "hover:border-foreground/40",
                    )}
                    style={{ borderStyle: styles.dashed ? "dashed" : "solid" }}
                  >
                    <span className={cn("flex h-5 w-5 items-center justify-center", styles.text)}>
                      {styles.icon}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {section.title || "Untitled section"}
                    </p>
                    {section.subtitle ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {section.subtitle}
                      </p>
                    ) : null}
                  </div>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "mt-1 h-8 w-8 text-muted-foreground transition",
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
                      )}
                      aria-label="Section actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      onSelect={() => {
                        setDeleteTargetId(section.id)
                        setConfirmDeleteOpen(true)
                      }}
                      className="text-destructive focus:text-destructive"
                      disabled={sections.length <= 1 || isPending || deletingId === section.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete section
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>
      </aside>

      <section className="w-full min-w-0 space-y-6 lg:col-start-2 lg:col-end-3 lg:justify-self-center lg:max-w-[44rem]">
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
        <div className="rounded-2xl border border-border/60 bg-card/80 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                  isDirty
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-600"
                    : "border-border/60 bg-muted/40 text-muted-foreground",
                )}
              >
                {savingId === activeSection.id ? "Saving" : isDirty ? "Unsaved" : "Saved"}
              </span>
              {lastUpdatedLabel ? <span>Updated {lastUpdatedLabel} ago</span> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setShareOpen(true)}>
                <Share2 className="mr-1 h-4 w-4" />
                Share settings
              </Button>
              <Button type="button" onClick={handleSave} disabled={!isDirty || isPending}>
                {savingId === activeSection.id ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          <div className="space-y-6 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Section details</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground lg:hidden"
                      aria-label="Section actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    <DropdownMenuItem
                      onSelect={() => {
                        setDeleteTargetId(activeSection.id)
                        setConfirmDeleteOpen(true)
                      }}
                      className="text-destructive focus:text-destructive"
                      disabled={sections.length <= 1 || isPending || deletingId === activeSection.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete section
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <RoadmapVisibilityToggle
                initialPublic={roadmapIsPublic}
                publicSlug={publicSlug}
                onPublicChange={onRoadmapPublicChange}
              />
            </div>

            <div className="max-w-3xl space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roadmap-section-title" className="sr-only">
                  Title
                </Label>
                <Input
                  id="roadmap-section-title"
                  value={activeDraft.title}
                  onChange={(event) => handleDraftChange({ title: event.target.value })}
                  placeholder="Title"
                  className="h-auto border-transparent bg-transparent px-0 text-3xl font-semibold tracking-tight shadow-none placeholder:text-muted-foreground/60 focus-visible:border-transparent focus-visible:ring-0 md:text-4xl"
                />
                <Label htmlFor="roadmap-section-subtitle" className="sr-only">
                  Subtitle
                </Label>
                <Input
                  id="roadmap-section-subtitle"
                  value={activeDraft.subtitle}
                  onChange={(event) => handleDraftChange({ subtitle: event.target.value })}
                  placeholder="Add a subtitle..."
                  className="h-auto border-transparent bg-transparent px-0 text-lg text-muted-foreground shadow-none placeholder:text-muted-foreground/60 focus-visible:border-transparent focus-visible:ring-0"
                />
              </div>

              <RichTextEditor
                value={activeDraft.content}
                onChange={(value) => handleDraftChange({ content: value })}
                placeholder={activeDraft.placeholder ?? DEFAULT_PLACEHOLDER}
                minHeight={editorMinHeight}
                stableScrollbars
                onImageUpload={handleImageUpload}
                className="rounded-none border-transparent bg-transparent shadow-none"
              />
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
