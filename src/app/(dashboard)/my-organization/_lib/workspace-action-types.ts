import type {
  WorkspaceBoardState,
  WorkspaceCardId,
  WorkspaceCollaborationInvite,
} from "../_components/workspace-board/workspace-board-types"

export type WorkspaceBoardActionResult =
  | { ok: true; boardState: WorkspaceBoardState }
  | { error: string }

export type WorkspaceNodePositionActionInput = {
  boardState: WorkspaceBoardState
  cardId: WorkspaceCardId
  x: number
  y: number
}

export type WorkspaceCollaborationActionResult =
  | {
      ok: true
      invite: WorkspaceCollaborationInvite
      invites: WorkspaceCollaborationInvite[]
      inviteWasAlreadyActive?: boolean
      notificationSent?: boolean
    }
  | { error: string }

export type WorkspaceRevokeActionResult =
  | { ok: true; invites: WorkspaceCollaborationInvite[] }
  | { error: string }

export type WorkspaceTutorialActionResult = { ok: true } | { error: string }
