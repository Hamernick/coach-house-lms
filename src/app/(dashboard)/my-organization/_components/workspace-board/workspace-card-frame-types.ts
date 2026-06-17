import type { ReactNode } from "react"

import type {
  WorkspaceCardId,
  WorkspaceCardSize,
} from "./workspace-board-constants"

export type WorkspaceCardFrameProps = {
  cardId: WorkspaceCardId
  title: string
  subtitle: string
  tone?: "default" | "accelerator"
  titleIcon?: ReactNode
  titleBadge?: ReactNode
  headerDetails?: ReactNode
  headerMeta?: ReactNode
  headerAction?: ReactNode
  hideTitle?: boolean
  hideSubtitle?: boolean
  size: WorkspaceCardSize
  presentationMode: boolean
  onSizeChange: (nextSize: WorkspaceCardSize) => void
  fullHref: string
  canEdit: boolean
  editorHref?: string | null
  menuActions?: WorkspaceCardOverflowAction[]
  contentClassName?: string
  footer?: ReactNode
  isCanvasFullscreen?: boolean
  onToggleCanvasFullscreen?: () => void
  fullscreenControlMode?: "overflow" | "inline"
  children: ReactNode
}

export type WorkspaceCardOverflowAction =
  | {
      id: string
      label: string
      icon?: ReactNode
      active?: boolean
      disabled?: boolean
      kind: "callback"
      onSelect: () => void
    }
  | {
      id: string
      label: string
      icon?: ReactNode
      active?: boolean
      disabled?: boolean
      kind: "link"
      href: string
      target?: "_self" | "_blank"
      download?: boolean
    }
