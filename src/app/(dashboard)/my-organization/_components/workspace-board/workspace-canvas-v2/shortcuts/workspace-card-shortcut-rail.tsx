"use client"

import type { ReactNode } from "react"

import type { WorkspaceCardShortcutItemModel } from "./workspace-card-shortcut-model"
import { WorkspaceCardShortcutButton } from "./workspace-card-shortcut-button"

export function WorkspaceCardShortcutRail({
  dataAction = null,
  items,
}: {
  dataAction?: ReactNode
  items: WorkspaceCardShortcutItemModel[]
}) {
  return (
    <div className="pointer-events-none absolute left-4 top-1/2 z-30 hidden -translate-y-1/2 md:flex">
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-border/70 bg-card/92 p-1 shadow-sm backdrop-blur transition-[box-shadow,background-color] duration-180 ease-out md:flex-col">
        {items.map((item) => (
          <WorkspaceCardShortcutButton
            key={item.id}
            item={item}
            tooltipSide="right"
          />
        ))}
        {dataAction}
      </div>
    </div>
  )
}
