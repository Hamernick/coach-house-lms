"use client"

import { createContext, useContext, type ReactNode } from "react"

const WorkspaceCanvasOverlayDrawerContainerContext =
  createContext<HTMLElement | null>(null)

export function WorkspaceCanvasOverlayDrawerContainerProvider({
  container,
  children,
}: {
  container: HTMLElement | null
  children: ReactNode
}) {
  return (
    <WorkspaceCanvasOverlayDrawerContainerContext.Provider value={container}>
      {children}
    </WorkspaceCanvasOverlayDrawerContainerContext.Provider>
  )
}

export function useWorkspaceCanvasOverlayDrawerContainer() {
  return useContext(WorkspaceCanvasOverlayDrawerContainerContext)
}
