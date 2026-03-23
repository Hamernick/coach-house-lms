"use client"

import type { WorkspaceCardShortcutItemModel } from "./workspace-card-shortcut-model"
import { WorkspaceCardShortcutButton } from "./workspace-card-shortcut-button"

export function WorkspaceOrganizationCardShortcuts({
  items,
}: {
  items: WorkspaceCardShortcutItemModel[]
}) {
  return (
    <div className="nodrag nopan hidden h-full min-h-0 w-full flex-col items-center justify-center gap-3 py-2 md:flex">
      {items.map((item) => (
        <WorkspaceCardShortcutButton key={item.id} item={item} />
      ))}
    </div>
  )
}
