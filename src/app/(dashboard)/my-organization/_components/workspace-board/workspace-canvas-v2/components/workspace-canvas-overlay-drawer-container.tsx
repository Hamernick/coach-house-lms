"use client"

import { createContext, useContext, type ReactNode } from "react"

import type { WorkspaceDataDrawerRequest } from "./workspace-canvas-overlay-drawer-tabs"

const WorkspaceCanvasOverlayDrawerContainerContext =
  createContext<HTMLElement | null>(null)
const WorkspaceCanvasOverlayDrawerRequestContext = createContext<
  ((request: Omit<WorkspaceDataDrawerRequest, "id">) => void) | null
>(null)

export function WorkspaceCanvasOverlayDrawerContainerProvider({
  container,
  onOpenDataDrawer,
  children,
}: {
  container: HTMLElement | null
  onOpenDataDrawer:
    | ((request: Omit<WorkspaceDataDrawerRequest, "id">) => void)
    | null
  children: ReactNode
}) {
  return (
    <WorkspaceCanvasOverlayDrawerContainerContext.Provider value={container}>
      <WorkspaceCanvasOverlayDrawerRequestContext.Provider
        value={onOpenDataDrawer}
      >
        {children}
      </WorkspaceCanvasOverlayDrawerRequestContext.Provider>
    </WorkspaceCanvasOverlayDrawerContainerContext.Provider>
  )
}

export function useWorkspaceCanvasOverlayDrawerContainer() {
  return useContext(WorkspaceCanvasOverlayDrawerContainerContext)
}

export function useWorkspaceCanvasOverlayDrawerRequest() {
  return useContext(WorkspaceCanvasOverlayDrawerRequestContext)
}
