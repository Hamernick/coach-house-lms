"use client"

import { createContext, useContext, type ReactNode } from "react"

type AppShellRightRailControls = {
  rightOpen: boolean
  setRightOpenUser: (open: boolean) => void
  setRightOpenAuto: (open: boolean) => void
}

const AppShellRightRailControlsContext =
  createContext<AppShellRightRailControls | null>(null)

export function AppShellRightRailControlsProvider({
  value,
  children,
}: {
  value: AppShellRightRailControls
  children: ReactNode
}) {
  return (
    <AppShellRightRailControlsContext.Provider value={value}>
      {children}
    </AppShellRightRailControlsContext.Provider>
  )
}

export function useAppShellRightRailControls() {
  return useContext(AppShellRightRailControlsContext)
}
