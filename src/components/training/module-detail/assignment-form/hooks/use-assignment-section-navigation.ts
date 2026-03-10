import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { MutableRefObject } from "react"

import type { AssignmentSection } from "../../assignment-sections"

type UseAssignmentSectionNavigationParams = {
  tabSections: AssignmentSection[]
  isStepper: boolean
  activeSectionId?: string
}

type UseAssignmentSectionNavigationResult = {
  shouldUseTabs: boolean
  useInlineTabs: boolean
  activeSection: string
  setActiveSection: (section: string) => void
  activeSectionKey: string
  tabRefs: MutableRefObject<(HTMLButtonElement | null)[]>
  indicator: { top: number; height: number }
  inlineActiveIndex: number
}

export function useAssignmentSectionNavigation({
  tabSections,
  isStepper,
  activeSectionId,
}: UseAssignmentSectionNavigationParams): UseAssignmentSectionNavigationResult {
  const shouldUseTabs = !isStepper && tabSections.length > 1
  const inlineTabTitles = useMemo(
    () => tabSections.map((section) => (section.title ?? "").trim().toLowerCase()),
    [tabSections],
  )
  const useInlineTabs = shouldUseTabs && inlineTabTitles.join("|") === "if|then|so"
  const [activeSection, setActiveSection] = useState<string>(tabSections[0]?.id ?? "section-0")
  const activeSectionKey = isStepper
    ? activeSectionId ?? tabSections[0]?.id ?? "section-0"
    : activeSection
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicator, setIndicator] = useState({ top: 0, height: 0 })

  useEffect(() => {
    if (isStepper) return
    setActiveSection((prev) =>
      tabSections.some((section) => section.id === prev) ? prev : tabSections[0]?.id ?? "section-0",
    )
  }, [isStepper, tabSections])

  useLayoutEffect(() => {
    if (isStepper) return
    const sectionIndex = tabSections.findIndex((tab) => tab.id === activeSection)
    const triggerElement = tabRefs.current[sectionIndex]
    if (!triggerElement) return

    const { offsetTop, offsetHeight } = triggerElement
    setIndicator({ top: offsetTop, height: offsetHeight })
  }, [activeSection, isStepper, tabSections])

  const inlineActiveIndex = useMemo(() => {
    if (!useInlineTabs) return -1
    return tabSections.findIndex((section) => section.id === activeSectionKey)
  }, [activeSectionKey, tabSections, useInlineTabs])

  return {
    shouldUseTabs,
    useInlineTabs,
    activeSection,
    setActiveSection,
    activeSectionKey,
    tabRefs,
    indicator,
    inlineActiveIndex,
  }
}
