"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { formatDistanceToNowStrict } from "date-fns"
import Link from "next/link"
import { usePathname } from "next/navigation"
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"
import HouseIcon from "lucide-react/dist/esm/icons/house"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"

import { saveRoadmapSectionAction } from "@/actions/roadmap"
import { Button } from "@/components/ui/button"
import { RightRailSlot } from "@/components/app-shell/right-rail"
import { ROADMAP_SECTION_ICONS } from "@/components/roadmap/roadmap-icons"
import { RoadmapCalendar } from "@/components/roadmap/roadmap-calendar"
import { RoadmapSectionPanel } from "@/components/roadmap/roadmap-section-panel"
import { uploadOrgMedia, validateOrgMediaFile } from "@/lib/organization/org-media"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import { ROADMAP_SECTION_IDS, type RoadmapSection, type RoadmapSectionStatus } from "@/lib/roadmap"

const ROADMAP_SECTION_ORDER = new Map<string, number>(ROADMAP_SECTION_IDS.map((id, index) => [id, index]))

function isFrameworkSection(section: RoadmapSection) {
  return ROADMAP_SECTION_ORDER.has(section.id)
}

function RoadmapTocIcon({
  sectionId,
  active,
  compact = false,
}: {
  sectionId: string
  active: boolean
  compact?: boolean
}) {
  const Icon = ROADMAP_SECTION_ICONS[sectionId] ?? SparklesIcon
  return (
    <span aria-hidden className={cn("flex shrink-0 items-center justify-center", active ? "text-foreground" : "text-muted-foreground")}>
      <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
    </span>
  )
}

type RoadmapEditorProps = {
  sections: RoadmapSection[]
  publicSlug: string | null
  canEdit?: boolean
  layout?: RoadmapEditorLayout
  initialSectionId?: string | null
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
  status?: RoadmapSectionStatus
}

const DEFAULT_PLACEHOLDER = "Start writing..."
const ROADMAP_DRAFT_STORAGE_VERSION = 1
const ROADMAP_TOOLBAR_ID = "roadmap-editor-toolbar"

const FUNDRAISING_CHILD_IDS = ["fundraising_strategy", "fundraising_presentation", "fundraising_crm_plan"]
const BOARD_CHILD_IDS = ["board_calendar", "board_handbook"]

const TOC_GROUPS = [
  { id: "origin_story" },
  { id: "need" },
  { id: "mission_vision_values" },
  { id: "theory_of_change" },
  { id: "program" },
  { id: "evaluation" },
  { id: "people" },
  { id: "budget" },
  { id: "fundraising", children: FUNDRAISING_CHILD_IDS },
  { id: "communications" },
  { id: "board_strategy", children: BOARD_CHILD_IDS },
  { id: "next_actions" },
]

const TOC_GROUP_PARENT_BY_CHILD = new Map<string, string>([
  ...FUNDRAISING_CHILD_IDS.map((id) => [id, "fundraising"]),
  ...BOARD_CHILD_IDS.map((id) => [id, "board_strategy"]),
])

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
    placeholder: section.prompt ?? section.placeholder ?? DEFAULT_PLACEHOLDER,
  }
}

export function RoadmapEditor({
  sections: initialSections,
  publicSlug,
  canEdit = true,
  initialSectionId = null,
  onDirtyChange,
  onRegisterDiscard,
}: RoadmapEditorProps) {
  const storageKey = useMemo(
    () => `roadmap-draft:${publicSlug ?? "private"}`,
    [publicSlug],
  )
  const initialActiveId = useMemo(() => {
    if (!initialSectionId) return ""
    return initialSections.some((section) => section.id === initialSectionId) ? initialSectionId : ""
  }, [initialSections, initialSectionId])
  const [sections, setSections] = useState<RoadmapSection[]>(() => initialSections)
  const [drafts, setDrafts] = useState<Record<string, RoadmapDraft>>(() => {
    const entries = initialSections.map((section) => [section.id, createDraft(section)] as const)
    return Object.fromEntries(entries)
  })
  const [activeId, setActiveId] = useState(initialActiveId || initialSections[0]?.id || "")
  const [savingId, setSavingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isHydrated, setIsHydrated] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    fundraising: true,
    board_strategy: true,
  })
  const [tocIndicator, setTocIndicator] = useState({ top: 0, height: 0, visible: false })
  const [headerIconSize, setHeaderIconSize] = useState<number | null>(null)
  const sectionsListRef = useRef<HTMLDivElement | null>(null)
  const headerTextRef = useRef<HTMLDivElement | null>(null)
  const imagePickerRef = useRef<(() => void) | null>(null)
  const sectionsRef = useRef(sections)
  const draftsRef = useRef(drafts)
  const activeIdRef = useRef(activeId)
  const pathname = usePathname()
  const isAcceleratorRoadmapView = Boolean(pathname?.startsWith("/accelerator/roadmap"))
  const basePath = useMemo(() => {
    if (!pathname) return "/roadmap"
    if (pathname.startsWith("/accelerator/roadmap")) return "/accelerator/roadmap"
    const roadmapIndex = pathname.indexOf("/roadmap")
    if (roadmapIndex !== -1) return pathname.slice(0, roadmapIndex + "/roadmap".length)
    return "/roadmap"
  }, [pathname])
  const getSectionHref = useCallback((slug: string) => `${basePath}/${slug}`, [basePath])

  useEffect(() => {
    sectionsRef.current = sections
  }, [sections])

  useEffect(() => {
    draftsRef.current = drafts
  }, [drafts])

  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  const tocItems = useMemo(() => {
    const sectionMap = new Map(sections.map((section) => [section.id, section]))
    const items: Array<
      | { type: "item"; section: RoadmapSection; depth: number }
      | { type: "group"; section: RoadmapSection; depth: number; children: RoadmapSection[] }
    > = []
    const seen = new Set<string>()

    TOC_GROUPS.forEach((group) => {
      const section = sectionMap.get(group.id)
      if (!section) return
      seen.add(section.id)
      if (group.children?.length) {
        const children = group.children
          .map((childId) => sectionMap.get(childId))
          .filter((child): child is RoadmapSection => Boolean(child))
        children.forEach((child) => seen.add(child.id))
        items.push({ type: "group", section, depth: 0, children })
        return
      }
      items.push({ type: "item", section, depth: 0 })
    })

    sections.forEach((section) => {
      if (seen.has(section.id)) return
      items.push({ type: "item", section, depth: 0 })
    })

    return items
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
  }, [initialSections, initialActiveId, storageKey])

  const initialActiveIdRef = useRef(initialActiveId)

  useEffect(() => {
    if (!initialActiveId) return
    if (initialActiveIdRef.current === initialActiveId) return
    initialActiveIdRef.current = initialActiveId
    setActiveId(initialActiveId)
  }, [initialActiveId])

  useEffect(() => {
    setIsHydrated(true)
  }, [])

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
    const parentId = TOC_GROUP_PARENT_BY_CHILD.get(activeId)
    if (!parentId) return
    setOpenGroups((prev) => (prev[parentId] ? prev : { ...prev, [parentId]: true }))
  }, [activeId])

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

  const updateTocIndicator = useCallback(() => {
    const element = sectionsListRef.current
    if (!element) return
    const activeElement = element.querySelector<HTMLElement>("[data-toc-item][data-active='true']")
    if (!activeElement) {
      setTocIndicator((prev) => (prev.visible ? { ...prev, visible: false } : prev))
      return
    }
    const listRect = element.getBoundingClientRect()
    const activeRect = activeElement.getBoundingClientRect()
    const nextTop = Math.max(0, activeRect.top - listRect.top)
    const nextHeight = Math.max(12, activeRect.height)
    setTocIndicator({ top: nextTop, height: nextHeight, visible: true })
  }, [])

  useEffect(() => {
    const element = sectionsListRef.current
    if (!element || typeof ResizeObserver === "undefined") return
    updateTocIndicator()
    const observer = new ResizeObserver(() => {
      updateTocIndicator()
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [updateTocIndicator])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      updateTocIndicator()
    })
    return () => cancelAnimationFrame(frame)
  }, [activeId, openGroups, sections, updateTocIndicator])

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeId) ?? sections[0],
    [activeId, sections],
  )

  const activeDraft = activeSection ? drafts[activeSection.id] ?? createDraft(activeSection) : null
  const headerTitle = activeSection
    ? isFrameworkSection(activeSection)
      ? activeSection.templateTitle
      : activeSection.title
    : ""
  const headerSubtitle = activeSection
    ? isFrameworkSection(activeSection)
      ? activeSection.templateSubtitle
      : activeSection.subtitle
    : ""
  const showSectionHeader = Boolean(headerTitle || headerSubtitle)
  const editorPlaceholder = activeSection?.placeholder ?? activeSection?.subtitleExample ?? DEFAULT_PLACEHOLDER
  const status = activeSection?.status ?? "not_started"
  const isCalendarSection = activeSection?.id === "board_calendar"
  const contentMaxWidth = isCalendarSection ? "max-w-none" : "max-w-3xl"
  const resolveSectionStatus = (section: RoadmapSection): RoadmapSectionStatus => {
    if (section.status) return section.status
    if (section.content.trim().length > 0) return "in_progress"
    if (section.homework?.status === "complete") return "complete"
    if (section.homework?.status === "in_progress") return "in_progress"
    return "not_started"
  }

  useEffect(() => {
    const element = headerTextRef.current
    if (!element) return
    const measure = () => {
      const next = Math.round(element.offsetHeight)
      if (!next) return
      setHeaderIconSize((prev) => (prev === next ? prev : next))
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => measure())
    observer.observe(element)
    return () => observer.disconnect()
  }, [headerTitle, headerSubtitle])

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

  const saveSectionById = useCallback(
    ({
      sectionId,
      showToast,
    }: {
      sectionId: string
      showToast: boolean
    }) => {
      if (!canEdit) return
      if (!sectionId) return
      if (savingId || isPending) return

      const section = sectionsRef.current.find((entry) => entry.id === sectionId)
      if (!section) return
      const draft = draftsRef.current[sectionId] ?? createDraft(section)
      const baseline = getBaseline(section)
      const sectionDirty =
        draft.title !== baseline.title ||
        draft.subtitle !== baseline.subtitle ||
        draft.content !== baseline.content ||
        draft.imageUrl !== baseline.imageUrl
      if (!sectionDirty) return

      const shouldMarkInProgress =
        section.status === "not_started" &&
        (draft.content.trim().length > 0 || draft.title.trim().length > 0 || draft.subtitle.trim().length > 0)

      setSavingId(section.id)
      startTransition(async () => {
        const result = await saveRoadmapSectionAction({
          sectionId: section.id,
          title: draft.title,
          subtitle: draft.subtitle,
          content: draft.content,
          imageUrl: draft.imageUrl,
          status: shouldMarkInProgress ? "in_progress" : undefined,
        })

        if ("error" in result) {
          if (showToast) toast.error(result.error)
          setSavingId(null)
          return
        }

        const nextSection = result.section
        setSections((prev) => {
          const index = prev.findIndex((entry) => entry.id === nextSection.id)
          if (index === -1) return [...prev, nextSection]
          return prev.map((entry, idx) => (idx === index ? nextSection : entry))
        })
        setDrafts((prev) => ({
          ...prev,
          [nextSection.id]: createDraft(nextSection),
        }))
        setSavingId(null)
        if (showToast) toast.success("Section saved")
      })
    },
    [canEdit, getBaseline, isPending, savingId],
  )

  const flushActiveSectionDraft = useCallback(() => {
    const sectionId = activeIdRef.current
    if (!sectionId) return
    saveSectionById({ sectionId, showToast: false })
  }, [saveSectionById])

  const handleSectionSelect = useCallback(
    (next: { id: string; slug: string }) => {
      if (next.id === activeIdRef.current) return
      flushActiveSectionDraft()
      setActiveId(next.id)
      if (typeof window === "undefined") return
      const nextHref = getSectionHref(next.slug)
      if (window.location.pathname === nextHref) return
      window.history.replaceState(window.history.state, "", nextHref)
    },
    [flushActiveSectionDraft, getSectionHref],
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
  }, [drafts, sections, storageKey, getBaseline])

  const handleDraftChange = (updates: Partial<RoadmapDraft>) => {
    if (!canEdit) return
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
    if (!canEdit) return
    if (!activeSection) return
    saveSectionById({ sectionId: activeSection.id, showToast: true })
  }

  useEffect(() => {
    if (!canEdit) return
    if (!activeSection || !activeDraft) return
    if (!isDirty) return
    if (savingId || isPending) return

    const timeout = window.setTimeout(() => {
      if (savingId || isPending) return
      saveSectionById({ sectionId: activeSection.id, showToast: false })
    }, bodyDirty ? 2500 : 1200)

    return () => window.clearTimeout(timeout)
  }, [activeDraft, activeSection, bodyDirty, canEdit, isDirty, isPending, saveSectionById, savingId])

  useEffect(() => {
    if (!canEdit) return
    if (!activeSection || !activeDraft) return
    if (!isDirty) return
    const interval = window.setInterval(() => {
      if (!isDirty || isPending || savingId) return
      saveSectionById({ sectionId: activeSection.id, showToast: false })
    }, 10000)
    return () => window.clearInterval(interval)
  }, [activeDraft, activeSection, canEdit, isDirty, isPending, saveSectionById, savingId])

  useEffect(() => {
    if (!canEdit) return
    return () => {
      flushActiveSectionDraft()
    }
  }, [canEdit, flushActiveSectionDraft])

  const handleImageUpload = useCallback(async (file: File) => {
    const error = validateOrgMediaFile(file)
    if (error) {
      throw new Error(error)
    }
    return uploadOrgMedia({ file, kind: "roadmap-inline" })
  }, [])

  const handleStatusChange = useCallback(
    (nextStatus: RoadmapSectionStatus) => {
      if (!canEdit) return
      if (!activeSection) return
      if (savingId || isPending) return
      setSavingId(activeSection.id)
      startTransition(async () => {
        const result = await saveRoadmapSectionAction({
          sectionId: activeSection.id,
          status: nextStatus,
        })

        if ("error" in result) {
          setSavingId(null)
          toast.error(result.error)
          return
        }

        const nextSection = result.section
        setSections((prev) => prev.map((section) => (section.id === nextSection.id ? nextSection : section)))
        setSavingId(null)
      })
    },
    [activeSection, canEdit, isPending, savingId],
  )

  if (!activeSection || !activeDraft) {
    return null
  }

  const SectionIcon = ROADMAP_SECTION_ICONS[activeSection.id] ?? SparklesIcon
  const tocHeader = (
    <div className="flex items-center gap-2">
      <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <WaypointsIcon className="h-4 w-4" aria-hidden />
        Strategic Roadmap
      </p>
    </div>
  )

  const tocPanel = (
    <div className="space-y-3">
      {tocHeader}
      <div
        ref={sectionsListRef}
        id="roadmap-section-picker-trigger"
        className="relative w-full min-w-0 space-y-1.5 pl-4 pr-2 text-sm"
      >
        <span
          aria-hidden
          className="absolute left-1 top-0 h-full w-px rounded-full bg-border/60"
        />
        <span
          aria-hidden
          className={cn(
            "absolute left-1 w-[2px] rounded-full bg-foreground/90 transition-[transform,height,opacity] duration-200 ease-out motion-reduce:transition-none",
            tocIndicator.visible ? "opacity-100" : "opacity-0",
          )}
          style={{
            height: `${tocIndicator.height}px`,
            transform: `translateY(${tocIndicator.top}px)`,
          }}
        />
        {tocItems.map((item) => {
          if (item.type === "group") {
            const groupOpen = openGroups[item.section.id] ?? true
            const isActive = item.section.id === activeSection.id
            const draft = drafts[item.section.id]
            const draftTitle = draft?.title?.trim()
            const displayTitle = isFrameworkSection(item.section)
              ? item.section.templateTitle
              : draftTitle || item.section.title?.trim() || ""
            const itemStatus = resolveSectionStatus(item.section)
            const itemStatusClass =
              itemStatus === "complete"
                ? "bg-emerald-500"
                : itemStatus === "in_progress"
                  ? "bg-amber-500"
                  : "bg-border"
            return (
              <div key={item.section.id} className="space-y-1 snap-start snap-always">
                <div className="group flex items-center gap-2">
                  <button
                    type="button"
                    data-toc-item
                    data-active={isActive}
                    data-toc-id={item.section.id}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => handleSectionSelect({ id: item.section.id, slug: item.section.slug })}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <RoadmapTocIcon sectionId={item.section.id} active={isActive} />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{displayTitle}</span>
                    </span>
                    <span aria-hidden className={cn("h-2 w-2 shrink-0 rounded-full", itemStatusClass)} />
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:text-foreground",
                      groupOpen && "text-foreground",
                    )}
                    aria-label={groupOpen ? "Collapse section group" : "Expand section group"}
                    aria-expanded={groupOpen}
                    onClick={() =>
                      setOpenGroups((prev) => ({ ...prev, [item.section.id]: !groupOpen }))
                    }
                  >
                    <ChevronDownIcon
                      className={cn("h-4 w-4 transition-transform", groupOpen ? "rotate-0" : "-rotate-90")}
                    />
                  </button>
                </div>
                {groupOpen
                  ? item.children.map((child) => {
                      const childIsActive = child.id === activeSection.id
                      const childDraft = drafts[child.id]
                      const childTitle = childDraft?.title?.trim()
                      const childDisplayTitle = isFrameworkSection(child)
                        ? child.templateTitle
                        : childTitle || child.title?.trim() || ""
                      const childStatus = resolveSectionStatus(child)
                      const childStatusClass =
                        childStatus === "complete"
                          ? "bg-emerald-500"
                          : childStatus === "in_progress"
                            ? "bg-amber-500"
                            : "bg-border"
                      return (
                        <div key={child.id} className="group flex items-center gap-2 snap-start snap-always">
                          <button
                            type="button"
                            data-toc-item
                            data-active={childIsActive}
                            data-toc-id={child.id}
                            aria-current={childIsActive ? "page" : undefined}
                            className={cn(
                              "flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 py-1.5 pl-6 text-left transition-colors",
                              childIsActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                            )}
                            onClick={() => handleSectionSelect({ id: child.id, slug: child.slug })}
                          >
                            <span className="flex min-w-0 flex-1 items-center gap-2">
                              <RoadmapTocIcon sectionId={child.id} active={childIsActive} compact />
                              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{childDisplayTitle}</span>
                            </span>
                            <span aria-hidden className={cn("h-2 w-2 shrink-0 rounded-full", childStatusClass)} />
                          </button>
                        </div>
                      )
                    })
                  : null}
              </div>
            )
          }

          const isActive = item.section.id === activeSection.id
          const draft = drafts[item.section.id]
          const draftTitle = draft?.title?.trim()
          const displayTitle = isFrameworkSection(item.section)
            ? item.section.templateTitle
            : draftTitle || item.section.title?.trim() || ""
          const itemStatus = resolveSectionStatus(item.section)
          const itemStatusClass =
            itemStatus === "complete"
              ? "bg-emerald-500"
              : itemStatus === "in_progress"
                ? "bg-amber-500"
                : "bg-border"

          return (
            <div key={item.section.id} className="group flex items-center gap-2 snap-start snap-always">
              <button
                type="button"
                data-toc-item
                data-active={isActive}
                data-toc-id={item.section.id}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => handleSectionSelect({ id: item.section.id, slug: item.section.slug })}
              >
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <RoadmapTocIcon sectionId={item.section.id} active={isActive} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{displayTitle}</span>
                </span>
                <span aria-hidden className={cn("h-2 w-2 shrink-0 rounded-full", itemStatusClass)} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <>
        <RightRailSlot>{tocPanel}</RightRailSlot>
        {isAcceleratorRoadmapView ? (
          <RightRailSlot priority={10} align="bottom">
            <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2">
              <Link href="/accelerator">
                <HouseIcon className="h-4 w-4" aria-hidden />
                Back To Accelerator
              </Link>
            </Button>
          </RightRailSlot>
        ) : null}
        <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col gap-6 overflow-hidden">
          <RoadmapSectionPanel
            title={headerTitle}
            subtitle={headerSubtitle}
            icon={SectionIcon}
            status={status}
            canEdit={canEdit}
            onStatusChange={handleStatusChange}
            statusSelectDisabled={isPending}
            isHydrated={isHydrated}
            showHeader={showSectionHeader}
            headerVariant={isCalendarSection ? "calendar" : "default"}
            headerIconSize={headerIconSize}
            headerTextRef={headerTextRef}
            contentMaxWidth={contentMaxWidth}
            toolbarSlotId={!isCalendarSection ? ROADMAP_TOOLBAR_ID : undefined}
            body={isCalendarSection ? <RoadmapCalendar /> : undefined}
            editorProps={
              isCalendarSection
                ? undefined
                : {
                    value: activeDraft.content,
                    onChange: (value) => handleDraftChange({ content: value }),
                    readOnly: !canEdit,
                    placeholder: editorPlaceholder,
                    header: activeDraft.placeholder ?? DEFAULT_PLACEHOLDER,
                    headerClassName: "bg-[#f4f4f5] px-4 pt-4 pb-3 text-sm text-muted-foreground dark:bg-[#1f1f1f]",
                    countClassName: "bg-[#e6e6e6] px-4 py-2 text-xs text-muted-foreground dark:bg-[#1c1c1c]",
                    contentClassName:
                      "flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[#ededed] dark:bg-[#171717] rounded-none",
                    onImageUpload: canEdit ? handleImageUpload : undefined,
                    insertUploadedImage: true,
                    onImagePickerReady: canEdit
                      ? (open) => {
                          imagePickerRef.current = open
                        }
                      : undefined,
                    disableResize: true,
                    toolbarTrailingActions: canEdit ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleSave}
                        disabled={isPending || !isDirty}
                        className="gap-2 text-muted-foreground hover:text-foreground"
                      >
                        {savingId === activeSection.id ? "Saving…" : isDirty ? "Save" : "Saved"}
                      </Button>
                    ) : null,
                    toolbarPortalId: ROADMAP_TOOLBAR_ID,
                    toolbarClassName:
                      "rounded-xl border border-border/60 bg-background/80 shadow-[0_1px_1px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_1px_rgba(0,0,0,0.24)]",
                    className: "flex h-full min-h-0 flex-1 flex-col bg-card dark:bg-[#1f1f1f]",
                    editorClassName:
                      "flex-1 min-h-0 h-full overflow-visible rounded-none bg-transparent dark:bg-[#171717]",
                  }
            }
          />
        </div>
    </>
  )
}
