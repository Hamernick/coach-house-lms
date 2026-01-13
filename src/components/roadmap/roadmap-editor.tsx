"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ComponentType } from "react"
import Image from "next/image"
import { formatDistanceToNowStrict } from "date-fns"
import CalendarClock from "lucide-react/dist/esm/icons/calendar-clock"
import PlusIcon from "lucide-react/dist/esm/icons/plus"
import ImageUp from "lucide-react/dist/esm/icons/image-up"
	import Compass from "lucide-react/dist/esm/icons/compass"
	import HandCoins from "lucide-react/dist/esm/icons/hand-coins"
	import Hand from "lucide-react/dist/esm/icons/hand"
	import LineChart from "lucide-react/dist/esm/icons/line-chart"
	import Sparkles from "lucide-react/dist/esm/icons/sparkles"
	import Trash2 from "lucide-react/dist/esm/icons/trash-2"
	import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal"
	import CheckIcon from "lucide-react/dist/esm/icons/check"
	import Rocket from "lucide-react/dist/esm/icons/rocket"
	import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"
	import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"

	import { deleteRoadmapSectionAction, saveRoadmapSectionAction } from "@/app/(dashboard)/strategic-roadmap/actions"
	import { RichTextEditor } from "@/components/rich-text-editor"
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
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Item, ItemContent, ItemMedia } from "@/components/ui/item"
import { Label } from "@/components/ui/label"
import { uploadOrgMedia, validateOrgMediaFile } from "@/lib/organization/org-media"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import { ROADMAP_SECTION_IDS, ROADMAP_SECTION_LIMIT, resolveRoadmapSections, type RoadmapSection } from "@/lib/roadmap"

const ROADMAP_SECTION_ORDER = new Map<string, number>(ROADMAP_SECTION_IDS.map((id, index) => [id, index]))

function getRoadmapSectionOrder(section: RoadmapSection) {
  return ROADMAP_SECTION_ORDER.get(section.id) ?? Number.POSITIVE_INFINITY
}

function isFrameworkSection(section: RoadmapSection) {
  return ROADMAP_SECTION_ORDER.has(section.id)
}

const FRAMEWORK_TEMPLATES = resolveRoadmapSections({})
const FRAMEWORK_TEMPLATE_MAP = new Map<string, RoadmapSection>(FRAMEWORK_TEMPLATES.map((section) => [section.id, section]))

type RoadmapEditorProps = {
  sections: RoadmapSection[]
  publicSlug: string | null
  roadmapIsPublic: boolean
  layout?: RoadmapEditorLayout
  onRoadmapPublicChange?: (next: boolean) => void
  onDirtyChange?: (dirty: boolean) => void
  onRegisterDiscard?: (handler: (() => void) | null) => void
}

export type RoadmapEditorLayout = "default" | "centered-right"

type RoadmapDraft = {
  id: string
  title: string
  subtitle: string
  content: string
  imageUrl: string
  layout: RoadmapSection["layout"]
  ctaLabel?: string
  ctaUrl?: string
  slug: string
  lastUpdated: string | null
  placeholder?: string
}

const DEFAULT_PLACEHOLDER = "Start writing..."
const ROADMAP_DRAFT_STORAGE_VERSION = 1
const ROADMAP_TOOLBAR_ID = "roadmap-editor-toolbar"

const SECTION_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  introduction: Hand,
  foundations: Compass,
  programs_and_pilots: Rocket,
  funding: HandCoins,
  metrics_and_learning: LineChart,
  timeline: CalendarClock,
}

type RoadmapDraftStorage = {
  version: number
  updatedAt: string
  drafts: Record<string, { title?: string; subtitle?: string; content?: string; imageUrl?: string }>
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
	    title: section.titleIsTemplate ? "" : section.title,
	    subtitle: section.subtitleIsTemplate ? "" : section.subtitle ?? "",
	    content: section.content ?? "",
	    imageUrl: section.imageUrl ?? "",
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
  layout = "default",
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
	  const [savingId, setSavingId] = useState<string | null>(null)
	  const [deletingId, setDeletingId] = useState<string | null>(null)
	  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
	  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
	  const [isPending, startTransition] = useTransition()
  const [editorMinHeight, setEditorMinHeight] = useState(240)
  const sectionsListRef = useRef<HTMLDivElement | null>(null)
  const imagePickerRef = useRef<(() => void) | null>(null)
  const missingFrameworkSections = useMemo(() => {
    const ids = new Set(sections.map((section) => section.id))
    return ROADMAP_SECTION_IDS.filter((id) => !ids.has(id))
      .map((id) => FRAMEWORK_TEMPLATE_MAP.get(id))
      .filter((section): section is RoadmapSection => Boolean(section))
  }, [sections])

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
	            imageUrl: draft.imageUrl ?? next[section.id].imageUrl,
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

	  const getBaseline = useCallback(
	    (section: RoadmapSection) => ({
	      title: section.titleIsTemplate ? "" : section.title,
	      subtitle: section.subtitleIsTemplate ? "" : section.subtitle ?? "",
	      content: section.content ?? "",
	      imageUrl: section.imageUrl ?? "",
	    }),
	    [],
	  )

  const isDirty = useMemo(() => {
    if (!activeSection || !activeDraft) return false
    const baseline = getBaseline(activeSection)
	    return (
	      activeDraft.title !== baseline.title ||
	      activeDraft.subtitle !== baseline.subtitle ||
	      activeDraft.content !== baseline.content ||
	      activeDraft.imageUrl !== baseline.imageUrl
	    )
	  }, [activeDraft, activeSection, getBaseline])

  const headingsDirty = useMemo(() => {
    if (!activeSection || !activeDraft) return false
    const baseline = getBaseline(activeSection)
    return activeDraft.title !== baseline.title || activeDraft.subtitle !== baseline.subtitle
  }, [activeDraft, activeSection, getBaseline])

  const bodyDirty = useMemo(() => {
    if (!activeSection || !activeDraft) return false
    const baseline = getBaseline(activeSection)
    return activeDraft.content !== baseline.content || activeDraft.imageUrl !== baseline.imageUrl
  }, [activeDraft, activeSection, getBaseline])

  const hasUnsavedChanges = useMemo(
    () =>
      sections.some((section) => {
        const draft = drafts[section.id]
        if (!draft) return false
        const baseline = getBaseline(section)
	        return (
	          draft.title !== baseline.title ||
	          draft.subtitle !== baseline.subtitle ||
	          draft.content !== baseline.content ||
	          draft.imageUrl !== baseline.imageUrl
	        )
	      }),
	    [sections, drafts, getBaseline],
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
	      const baseline = getBaseline(section)
	      if (
	        draft.title !== baseline.title ||
	        draft.subtitle !== baseline.subtitle ||
	        draft.content !== baseline.content ||
	        draft.imageUrl !== baseline.imageUrl
	      ) {
	        payload.drafts[section.id] = {
	          title: draft.title,
	          subtitle: draft.subtitle,
	          content: draft.content,
	          imageUrl: draft.imageUrl,
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

  const saveSection = useCallback(
    ({ showToast }: { showToast: boolean }) => {
      if (!activeSection || !activeDraft) return
      if (savingId || isPending) return
      setSavingId(activeSection.id)
      startTransition(async () => {
	        const result = await saveRoadmapSectionAction({
	          sectionId: activeSection.id,
	          title: activeDraft.title,
	          subtitle: activeDraft.subtitle,
	          content: activeDraft.content,
	          imageUrl: activeDraft.imageUrl,
	        })

        if ("error" in result) {
          if (showToast) toast.error(result.error)
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
        if (showToast) toast.success("Section saved")
      })
    },
    [activeDraft, activeSection, isPending, savingId],
  )

  const handleSave = () => {
    saveSection({ showToast: true })
  }

  useEffect(() => {
    if (!activeSection || !activeDraft) return
    if (!headingsDirty) return
    if (savingId || isPending) return

    const timeout = window.setTimeout(() => {
      if (savingId || isPending) return
      setSavingId(activeSection.id)
      startTransition(async () => {
        const result = await saveRoadmapSectionAction({
          sectionId: activeSection.id,
          title: activeDraft.title,
          subtitle: activeDraft.subtitle,
          ...(bodyDirty ? { content: activeDraft.content, imageUrl: activeDraft.imageUrl } : {}),
        })

        if ("error" in result) {
          setSavingId(null)
          return
        }

        const nextSection = result.section
        setSections((prev) => prev.map((section) => (section.id === nextSection.id ? nextSection : section)))
        setDrafts((prev) => ({
          ...prev,
          [nextSection.id]: createDraft(nextSection),
        }))
        setSavingId(null)
      })
    }, bodyDirty ? 2500 : 1200)

    return () => window.clearTimeout(timeout)
  }, [activeDraft, activeSection, bodyDirty, headingsDirty, isPending, savingId])

  useEffect(() => {
    if (!activeSection || !activeDraft) return
    if (!isDirty) return
    const interval = window.setInterval(() => {
      if (!isDirty || isPending || savingId) return
      saveSection({ showToast: false })
    }, 10000)
    return () => window.clearInterval(interval)
  }, [activeDraft, activeSection, isDirty, isPending, saveSection, savingId])

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

  const handleAddCustomSection = () => {
    if (sections.length >= ROADMAP_SECTION_LIMIT) {
      toast.error(`Roadmaps support up to ${ROADMAP_SECTION_LIMIT} sections.`)
      return
    }

    const id = makeId()
    const newSection: RoadmapSection = {
      id,
      title: "",
      subtitle: "",
      slug: id,
      titleExample: undefined,
      subtitleExample: undefined,
      placeholder: DEFAULT_PLACEHOLDER,
      content: "",
      lastUpdated: null,
      isPublic: false,
      layout: "square",
      ctaLabel: undefined,
      ctaUrl: undefined,
      templateTitle: "",
      templateSubtitle: "",
      titleIsTemplate: false,
      subtitleIsTemplate: false,
    }

    setSections((prev) => [...prev, newSection])
    setDrafts((prev) => ({ ...prev, [id]: createDraft(newSection) }))
    setActiveId(id)
  }

  const handleAddFrameworkSection = (frameworkId: string) => {
    if (sections.length >= ROADMAP_SECTION_LIMIT) {
      toast.error(`Roadmaps support up to ${ROADMAP_SECTION_LIMIT} sections.`)
      return
    }

    const template = FRAMEWORK_TEMPLATE_MAP.get(frameworkId)
    if (!template) {
      toast.error("Unable to add this section.")
      return
    }

    const newSection: RoadmapSection = {
      ...template,
      content: "",
      imageUrl: undefined,
      lastUpdated: null,
      isPublic: false,
      layout: "square",
      ctaLabel: undefined,
      ctaUrl: undefined,
    }

    setSections((prev) => {
      const next = [...prev]
      const newOrder = getRoadmapSectionOrder(newSection)
      const insertIndex = next.findIndex((section) => getRoadmapSectionOrder(section) > newOrder)
      if (insertIndex === -1) {
        next.push(newSection)
      } else {
        next.splice(insertIndex, 0, newSection)
      }
      return next
    })
    setDrafts((prev) => ({ ...prev, [frameworkId]: createDraft(newSection) }))
    setActiveId(frameworkId)
  }

  const handleImageUpload = useCallback(async (file: File) => {
    const error = validateOrgMediaFile(file)
    if (error) {
      throw new Error(error)
    }
    return uploadOrgMedia({ file, kind: "roadmap" })
  }, [])

	  if (!activeSection || !activeDraft) {
	    return null
	  }

	  const SectionIcon = SECTION_ICONS[activeSection.id] ?? Sparkles
	  const isCenteredRight = layout === "centered-right"
  const activeTitle = isFrameworkSection(activeSection)
    ? activeSection.templateTitle
    : activeDraft.title?.trim() || activeSection.title?.trim() || ""
  const activeSubtitle = isFrameworkSection(activeSection)
    ? activeSection.templateSubtitle
    : activeDraft.subtitle?.trim() || activeSection.subtitle?.trim() || ""
  const atSectionLimit = sections.length >= ROADMAP_SECTION_LIMIT
  const frameworkHeader = (
    <>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase leading-none tracking-[0.16em] text-muted-foreground">
        <WaypointsIcon className="h-3.5 w-3.5" aria-hidden />
        Framework
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild id="roadmap-add-section-trigger">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={atSectionLimit}
            aria-disabled={atSectionLimit}
            title={atSectionLimit ? `Max ${ROADMAP_SECTION_LIMIT} sections` : "Add section"}
            className={cn("gap-1", atSectionLimit && "cursor-not-allowed opacity-50")}
          >
            <PlusIcon className="h-4 w-4" />
            New
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[min(22rem,var(--radix-dropdown-menu-trigger-width))]">
          {missingFrameworkSections.length > 0 ? (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">Re-add framework section</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {missingFrameworkSections.map((section) => (
                <DropdownMenuItem
                  key={section.id}
                  onSelect={() => handleAddFrameworkSection(section.id)}
                  className="flex-col items-start gap-1"
                >
                  <span className="text-sm font-medium text-foreground">{section.templateTitle}</span>
                  {section.templateSubtitle ? (
                    <span className="line-clamp-2 text-xs text-muted-foreground">{section.templateSubtitle}</span>
                  ) : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">Add section</DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onSelect={handleAddCustomSection} className="gap-2">
            <PlusIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
            Custom section
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )

	  return (
	    <div
	      className={cn(
	        "flex w-full min-w-0 flex-col gap-6",
	        isCenteredRight
	          ? "lg:grid lg:grid-cols-[minmax(0,13rem)_minmax(0,44rem)_minmax(0,13rem)] lg:grid-rows-[auto_auto] lg:gap-x-2 lg:gap-y-6"
	          : "lg:grid lg:justify-center lg:grid-cols-[minmax(0,18rem)_minmax(0,48rem)] lg:grid-rows-[auto_auto] lg:gap-x-2 lg:gap-y-6 xl:grid-cols-[minmax(0,20rem)_minmax(0,48rem)]",
	      )}
	    >
        {isCenteredRight ? (
          <div className="hidden w-full min-w-0 lg:col-start-3 lg:row-start-1 lg:block">
            <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-[#FAFAFA] px-4 py-3 shadow-[0_1px_1px_rgba(0,0,0,0.06)] dark:bg-[#151515] dark:shadow-[0_1px_1px_rgba(0,0,0,0.24)]">
              {frameworkHeader}
            </div>
          </div>
        ) : null}
	      <aside
	        className={cn(
	          "w-full min-w-0 lg:sticky lg:top-16",
	          isCenteredRight ? "lg:row-start-2" : "lg:row-start-1 lg:row-span-2",
	          isCenteredRight ? "lg:col-start-3" : "lg:col-start-1",
	        )}
	      >
	        <div
	          className={cn(
	            "rounded-2xl px-4 pb-4 pt-1",
	            isCenteredRight
	              ? "border border-border/70 bg-[#FAFAFA] shadow-[0_1px_1px_rgba(0,0,0,0.06)] dark:bg-[#151515] dark:shadow-[0_1px_1px_rgba(0,0,0,0.24)]"
	              : "border border-transparent bg-transparent shadow-none",
	          )}
	        >
		          <div className={cn("flex items-center justify-between", isCenteredRight && "lg:hidden")}>
                {frameworkHeader}
	          </div>

          <div className="mt-3 lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild id="roadmap-section-picker-trigger">
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto w-full justify-between rounded-xl border-border/60 bg-background/70 px-3 py-3 shadow-none"
                >
                  <span className="flex min-w-0 items-start gap-3 text-left">
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background text-xs font-semibold text-muted-foreground">
                      {activeIndex + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {activeTitle || " "}
                      </span>
	                      {activeSubtitle ? (
	                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
	                          {activeSubtitle}
	                        </span>
	                      ) : null}
	                    </span>
	                  </span>
                  <ChevronDownIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[min(22rem,var(--radix-dropdown-menu-trigger-width))]">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Sections</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={activeSection.id} onValueChange={(value) => setActiveId(value)}>
                  {sections.map((section, index) => {
                    const draft = drafts[section.id]
                    const draftTitle = draft?.title?.trim()
                    const draftSubtitle = draft?.subtitle?.trim()
                    const framework = isFrameworkSection(section)
                    const title = framework ? section.templateTitle : draftTitle || section.title?.trim() || ""
                    const subtitle = framework ? section.templateSubtitle : draftSubtitle || section.subtitle?.trim() || ""
                    return (
                      <DropdownMenuRadioItem key={section.id} value={section.id} className="items-start">
                        <div className="grid min-w-0 gap-0.5">
                          <p className="truncate text-sm font-medium text-foreground">
                            {index + 1}. {title || " "}
                          </p>
                          {subtitle ? (
                            <p className="line-clamp-2 text-xs text-muted-foreground">{subtitle}</p>
                          ) : null}
                        </div>
                      </DropdownMenuRadioItem>
                    )
                  })}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div
            ref={sectionsListRef}
            className="relative mt-2 hidden w-full min-w-0 space-y-2 lg:block lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1"
            style={{
              ["--dot-size" as string]: "32px",
              ["--rail-offset" as string]: "0.5rem",
            }}
          >
            <div className="absolute left-[calc(var(--dot-size)/2+var(--rail-offset))] top-[calc(var(--dot-size)/2)] bottom-[calc(var(--dot-size)/2)] w-px -translate-x-1/2 bg-border/60">
              <div
                className="w-full rounded-full bg-gradient-to-b from-purple-500 via-blue-500 to-sky-400 transition-[height] duration-300 ease-out"
                style={{ height: `${sectionProgress}%` }}
              />
            </div>
	            {sections.map((section, index) => {
	              const isActive = section.id === activeSection.id
	              const isLast = index === sections.length - 1
	              const draft = drafts[section.id]
	              const draftTitle = draft?.title?.trim()
	              const draftSubtitle = draft?.subtitle?.trim()
                const framework = isFrameworkSection(section)
	              const displayTitle = framework ? section.templateTitle : draftTitle || section.title?.trim() || ""
	              const displaySubtitle = framework ? section.templateSubtitle : draftSubtitle || section.subtitle?.trim() || ""
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
                <div key={section.id} className="w-full min-w-0">
	                  <div
	                    role="button"
	                    tabIndex={0}
	                    onClick={() => setActiveId(section.id)}
	                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setActiveId(section.id)
                      }
                    }}
	                    aria-current={isActive ? "step" : undefined}
	                    className={cn(
	                      "group relative flex w-full min-w-0 items-start gap-3 rounded-xl px-2 py-2 text-left transition",
	                      isActive
	                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
	                        : "text-muted-foreground hover:bg-accent/50",
	                    )}
	                  >
	                    {isLast ? (
	                      <span
	                        aria-hidden
	                        className={cn(
	                          "pointer-events-none absolute left-[calc(var(--dot-size)/2+var(--rail-offset))] top-[calc(var(--dot-size)/2+0.5rem)] bottom-0 w-px -translate-x-1/2",
	                          isCenteredRight ? "bg-[#FAFAFA] dark:bg-[#151515]" : "bg-background",
	                        )}
	                      />
	                    ) : null}
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
                      <p className="truncate text-sm font-semibold text-foreground">{displayTitle}</p>
                      {displaySubtitle ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{displaySubtitle}</p>
                      ) : null}
                    </div>
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild id={`roadmap-section-actions-${section.id}`}>
                      <Button
                        type="button"
                        variant="ghost"
                          size="icon"
                          className={cn(
                            "mt-1 h-8 w-8 shrink-0 text-muted-foreground transition",
                            isActive
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
                          )}
                          aria-label="Section actions"
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
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
                </div>
              )
            })}
	          </div>
	        </div>
	      </aside>

      <div className="w-full min-w-0 lg:col-start-2 lg:row-start-1">
        <div className="mx-auto w-full max-w-3xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <RoadmapVisibilityToggle
                initialPublic={roadmapIsPublic}
                publicSlug={publicSlug}
                onPublicChange={onRoadmapPublicChange}
                showViewAction={false}
              />
	            </div>
	            <div className="flex items-center gap-2">
	              <Button type="button" onClick={handleSave} disabled={isPending}>
	                {savingId === activeSection.id ? "Saving..." : isDirty ? "Save" : "Saved"}
	              </Button>
	            </div>
	          </div>

              {isFrameworkSection(activeSection) ? (
                <Item className="border-dashed border-border/70 bg-[#FAFAFA] px-4 py-3 dark:bg-[#151515]">
                  <ItemMedia>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-white">
                      <SectionIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
                    </div>
                  </ItemMedia>
                  <ItemContent className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{activeSection.templateTitle}</p>
                    {activeSection.templateSubtitle ? (
                      <p className="text-xs text-muted-foreground">{activeSection.templateSubtitle}</p>
                    ) : null}
                  </ItemContent>
                </Item>
              ) : null}
		        </div>
		      </div>

      <section className="w-full min-w-0 lg:col-start-2 lg:row-start-2">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roadmap-section-title" className="sr-only">
              Title
            </Label>
            <Textarea
              id="roadmap-section-title"
              value={activeDraft.title}
              onChange={(event) => handleDraftChange({ title: event.target.value })}
              placeholder="Title"
              rows={1}
              maxLength={80}
              className="min-h-0 resize-none overflow-hidden border-transparent bg-transparent px-2 py-1 text-2xl font-semibold tracking-tight shadow-none placeholder:text-[#9CA3AF] dark:placeholder:text-[#9CA3AF] focus-visible:border-transparent focus-visible:ring-0 md:text-3xl"
            />
            <Label htmlFor="roadmap-section-subtitle" className="sr-only">
              Subtitle
            </Label>
            <Textarea
              id="roadmap-section-subtitle"
              value={activeDraft.subtitle}
              onChange={(event) => handleDraftChange({ subtitle: event.target.value })}
              placeholder="Add a subtitle"
              rows={1}
              maxLength={140}
              className="min-h-0 resize-none overflow-hidden border-transparent bg-transparent px-2 py-1 text-lg text-muted-foreground shadow-none placeholder:text-[#9CA3AF] dark:placeholder:text-[#9CA3AF] focus-visible:border-transparent focus-visible:ring-0"
            />
          </div>

          {activeDraft.imageUrl ? (
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted/20">
              <div className="relative aspect-video w-full">
                <Image
                  src={activeDraft.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 48rem, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute right-3 top-3 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl bg-background/80 shadow-sm backdrop-blur"
                  aria-label="Swap image"
                  title="Swap image"
                  onClick={() => imagePickerRef.current?.()}
                >
                  <ImageUp className="h-4 w-4" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl bg-background/80 shadow-sm backdrop-blur"
                  aria-label="Remove image"
                  title="Remove image"
                  onClick={() => handleDraftChange({ imageUrl: "" })}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          ) : null}

          <div id={ROADMAP_TOOLBAR_ID} className="w-full" />

	          <RichTextEditor
	            value={activeDraft.content}
	            onChange={(value) => handleDraftChange({ content: value })}
	            placeholder={activeDraft.placeholder ?? DEFAULT_PLACEHOLDER}
	            minHeight={editorMinHeight}
	            stableScrollbars
	            onImageUpload={handleImageUpload}
	            onImageUploaded={({ url }) => handleDraftChange({ imageUrl: url })}
	            insertUploadedImage={false}
	            onImagePickerReady={(open) => {
	              imagePickerRef.current = open
	            }}
	            toolbarPortalId={ROADMAP_TOOLBAR_ID}
	            toolbarClassName="rounded-xl border border-border/60 bg-background/80 shadow-[0_1px_1px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_1px_rgba(0,0,0,0.24)]"
	            className="rounded-none border-0 bg-transparent shadow-none"
	            editorClassName="rounded-md bg-transparent"
	          />
        </div>
      </section>

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
