import { WorkspaceCardShortcutsMobile } from "../shortcuts/workspace-card-shortcuts-mobile"
import type { WorkspaceCardShortcutItemModel } from "../shortcuts/workspace-card-shortcut-model"

export function WorkspaceCanvasSurfaceV2MobileShortcutOverlay({
  items,
}: {
  items: WorkspaceCardShortcutItemModel[]
}) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-10 md:hidden">
      <WorkspaceCardShortcutsMobile items={items} />
    </div>
  )
}
