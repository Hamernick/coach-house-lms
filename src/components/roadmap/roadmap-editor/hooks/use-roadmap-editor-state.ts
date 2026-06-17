"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { usePathname } from "next/navigation"

import { saveRoadmapSectionAction } from "@/actions/roadmap"
import { uploadOrgMedia, validateOrgMediaFile } from "@/lib/organization/org-media"
import { toast } from "@/lib/toast"
import { type RoadmapSection, type RoadmapSectionStatus } from "@/lib/roadmap"
import {
  WORKSPACE_PATH,
  WORKSPACE_ROADMAP_PATH,
  getWorkspaceRoadmapSectionPath,
} from "@/lib/workspace/routes"

import { resolveRoadmapBasePath } from "../paths"
import { deriveRoadmapEditorSectionUi } from "../ui-state"
import {
  createDraft,
  createDraftMap,
  getRoadmapSectionBaseline,
  isRoadmapDraftDirty,
  loadRoadmapDraftsFromStorage,
} from "../helpers"
import { type RoadmapDraft } from "../types"
import { useRoadmapEditorAutosave } from "./use-roadmap-editor-autosave"
import { useRoadmapEditorDraftPersistence } from "./use-roadmap-editor-draft-persistence"
import type { UseRoadmapEditorStateArgs, UseRoadmapEditorStateResult } from "./use-roadmap-editor-state-types"

export function useRoadmapEditorState({
  sections: initialSections,
  publicSlug,
  canEdit = true,
  initialSectionId = null,
  onDirtyChange,
  onRegisterDiscard,
}: UseRoadmapEditorStateArgs): UseRoadmapEditorStateResult {
  const storageKey = useMemo(
    () => `roadmap-draft:${publicSlug ?? "private"}`,
    [publicSlug],
  )
  const initialActiveId = useMemo(() => {
    if (!initialSectionId) return ""
    return initialSections.some((section) => section.id === initialSectionId) ? initialSectionId : ""
  }, [initialSections, initialSectionId])
  const [sections, setSections] = useState<RoadmapSection[]>(() => initialSections)
  const [drafts, setDrafts] = useState<Record<string, RoadmapDraft>>(() =>
    createDraftMap(initialSections),
  )
  const [activeId, setActiveId] = useState(initialActiveId || initialSections[0]?.id || "")
  const [savingId, setSavingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isHydrated, setIsHydrated] = useState(false)
  const sectionsRef = useRef(sections)
  const draftsRef = useRef(drafts)
  const activeIdRef = useRef(activeId)
  const pathname = usePathname()
  const basePath = useMemo(() => resolveRoadmapBasePath(pathname), [pathname])
  const isWorkspaceRoadmapView = basePath === WORKSPACE_ROADMAP_PATH
  const roadmapReturnHref = isWorkspaceRoadmapView ? WORKSPACE_PATH : null
  const roadmapReturnLabel = isWorkspaceRoadmapView ? "Return To Workspace" : null
  const getSectionHref = useCallback(
    (slug: string) =>
      basePath === WORKSPACE_ROADMAP_PATH
        ? getWorkspaceRoadmapSectionPath(slug)
        : `${basePath}/${slug}`,
    [basePath],
  )

  useEffect(() => {
    sectionsRef.current = sections
  }, [sections])

  useEffect(() => {
    draftsRef.current = drafts
  }, [drafts])

  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  useEffect(() => {
    setSections(initialSections)
    setDrafts(() => loadRoadmapDraftsFromStorage(storageKey, initialSections))
    setActiveId((prev) => prev || initialSections[0]?.id || "")
  }, [initialSections, storageKey])

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

  const {
    activeSection,
    activeDraft,
    headerTitle,
    headerSubtitle,
    showSectionHeader,
    editorPlaceholder,
    status,
    isCalendarSection,
    contentMaxWidth,
  } = useMemo(() => deriveRoadmapEditorSectionUi({ sections, activeId, drafts }), [sections, activeId, drafts])
  const headerTextRef = useRef<HTMLDivElement | null>(null)
  const [headerIconSize, setHeaderIconSize] = useState<number | null>(null)

  useEffect(() => {
    const element = headerTextRef.current
    if (!element) return
    const measure = () => {
      const next = Math.round(element.offsetHeight)
      if (!next) return
      setHeaderIconSize((previous) => (previous === next ? previous : next))
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => measure())
    observer.observe(element)
    return () => observer.disconnect()
  }, [headerTitle, headerSubtitle])

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
      if (!isRoadmapDraftDirty(section, draft)) return

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
    [canEdit, isPending, savingId],
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
    return isRoadmapDraftDirty(activeSection, activeDraft)
  }, [activeDraft, activeSection])

  const bodyDirty = useMemo(() => {
    if (!activeSection || !activeDraft) return false
    const baseline = getRoadmapSectionBaseline(activeSection)
    return activeDraft.content !== baseline.content || activeDraft.imageUrl !== baseline.imageUrl
  }, [activeDraft, activeSection])

  useRoadmapEditorDraftPersistence({
    sections,
    drafts,
    setDrafts,
    storageKey,
    onDirtyChange,
    onRegisterDiscard,
  })

  const handleDraftChange = useCallback(
    (updates: Partial<RoadmapDraft>) => {
      if (!canEdit) return
      if (!activeSection) return
      setDrafts((prev) => ({
        ...prev,
        [activeSection.id]: {
          ...(prev[activeSection.id] ?? createDraft(activeSection)),
          ...updates,
        },
      }))
    },
    [activeSection, canEdit],
  )

  const handleSave = useCallback(() => {
    if (!canEdit) return
    if (!activeSection) return
    saveSectionById({ sectionId: activeSection.id, showToast: true })
  }, [activeSection, canEdit, saveSectionById])

  useRoadmapEditorAutosave({
    canEdit,
    activeSection,
    activeDraft,
    isDirty,
    bodyDirty,
    isPending,
    savingId,
    saveSectionById,
    flushActiveSectionDraft,
  })

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

  return {
    activeSection,
    activeDraft,
    drafts,
    handleSectionSelect,
    roadmapBasePath: basePath,
    roadmapReturnHref,
    roadmapReturnLabel,
    headerTitle,
    headerSubtitle,
    showSectionHeader,
    headerIconSize,
    headerTextRef,
    status,
    statusSelectDisabled: isPending,
    isHydrated,
    isCalendarSection,
    contentMaxWidth,
    editorPlaceholder,
    handleDraftChange,
    handleImageUpload,
    handleSave,
    isDirty,
    savingId,
    handleStatusChange,
  }
}
