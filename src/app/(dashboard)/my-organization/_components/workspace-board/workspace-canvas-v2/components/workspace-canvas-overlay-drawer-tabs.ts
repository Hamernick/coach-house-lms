"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type WorkspaceCanvasDrawerTab = "people" | "documents"

export type WorkspaceDataDrawerTabIndicator = {
  left: number
  width: number
  visible: boolean
}

const WORKSPACE_DATA_DRAWER_EMPTY_TAB_INDICATOR: WorkspaceDataDrawerTabIndicator =
  {
    left: 0,
    width: 0,
    visible: false,
  }

export function useWorkspaceDataDrawerTabIndicator({
  drawerCollapsed,
  tab,
}: {
  drawerCollapsed: boolean
  tab: WorkspaceCanvasDrawerTab
}) {
  const tabsHeaderRef = useRef<HTMLDivElement | null>(null)
  const tabsListRef = useRef<HTMLDivElement | null>(null)
  const [tabIndicator, setTabIndicator] =
    useState<WorkspaceDataDrawerTabIndicator>(
      WORKSPACE_DATA_DRAWER_EMPTY_TAB_INDICATOR
    )

  const updateTabIndicator = useCallback(() => {
    const tabsHeader = tabsHeaderRef.current
    const activeTabTrigger =
      tabsListRef.current?.querySelector<HTMLElement>(
        '[data-slot="tabs-trigger"][data-state="active"]'
      ) ?? null

    if (!tabsHeader || !activeTabTrigger) {
      setTabIndicator(WORKSPACE_DATA_DRAWER_EMPTY_TAB_INDICATOR)
      return
    }

    const headerRect = tabsHeader.getBoundingClientRect()
    const activeTriggerRect = activeTabTrigger.getBoundingClientRect()
    const nextIndicator = {
      left: activeTriggerRect.left - headerRect.left,
      width: activeTriggerRect.width,
      visible: true,
    }

    setTabIndicator((current) => {
      const leftChanged = Math.abs(current.left - nextIndicator.left) > 0.5
      const widthChanged = Math.abs(current.width - nextIndicator.width) > 0.5

      if (
        current.visible === nextIndicator.visible &&
        !leftChanged &&
        !widthChanged
      ) {
        return current
      }

      return nextIndicator
    })
  }, [])

  useEffect(() => {
    if (drawerCollapsed) {
      setTabIndicator(WORKSPACE_DATA_DRAWER_EMPTY_TAB_INDICATOR)
      return
    }

    updateTabIndicator()

    const animationFrame = window.requestAnimationFrame(updateTabIndicator)
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateTabIndicator)

    if (tabsHeaderRef.current) resizeObserver?.observe(tabsHeaderRef.current)
    if (tabsListRef.current) resizeObserver?.observe(tabsListRef.current)

    window.addEventListener("resize", updateTabIndicator)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver?.disconnect()
      window.removeEventListener("resize", updateTabIndicator)
    }
  }, [drawerCollapsed, tab, updateTabIndicator])

  return {
    tabIndicator,
    tabsHeaderRef,
    tabsListRef,
  }
}
