"use client"

import type { WorkspaceCardShortcutItemModel } from "./workspace-card-shortcut-model"
import { WorkspaceCardShortcutButton } from "./workspace-card-shortcut-button"

export function WorkspaceOrganizationCardShortcuts({
  items,
}: {
  items: WorkspaceCardShortcutItemModel[]
}) {
  return (
    <div className="hidden h-full min-h-0 flex-col items-center gap-3 md:flex">
      {items.map((item) => (
        <WorkspaceCardShortcutButton key={item.id} item={item} />
      ))}
    </div>
  )
}
