"use client"

import { RightRailProvider } from "@/components/app-shell/right-rail"

import { AppShellInner } from "./app-shell/app-shell-inner"
import type { AppShellProps } from "./app-shell/types"

export function AppShell(props: AppShellProps) {
  return (
    <RightRailProvider>
      <AppShellInner {...props} />
    </RightRailProvider>
  )
}
