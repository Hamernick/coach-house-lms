"use client"

import Link from "next/link"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import EyeIcon from "lucide-react/dist/esm/icons/eye"
import LayoutGridIcon from "lucide-react/dist/esm/icons/layout-grid"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"
import WandSparklesIcon from "lucide-react/dist/esm/icons/wand-sparkles"

import { CurrentUserAvatar } from "@/components/current-user-avatar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { WorkspaceBoardCollaboration } from "./workspace-board-collaboration"
import { WorkspaceBoardInviteSheet } from "./workspace-board-invite-sheet"
import type {
  WorkspaceCollaborationInvite,
  WorkspaceLayoutPreset,
  WorkspaceLayoutPresetMeta,
  WorkspaceMemberOption,
} from "./workspace-board-types"
import { WORKSPACE_LAYOUT_PRESET_META } from "./workspace-board-types"
const PRESET_LABELS: Record<WorkspaceLayoutPreset, string> = Object.fromEntries(
  Object.entries(WORKSPACE_LAYOUT_PRESET_META).map(([preset, meta]) => [
    preset,
    (meta as WorkspaceLayoutPresetMeta).label,
  ]),
) as Record<WorkspaceLayoutPreset, string>

export function WorkspaceBoardToolbar({
  preset,
  canEdit,
  presentationMode,
  canInvite,
  members,
  invites,
  realtimeState,
  isSaving,
  roomName,
  currentUser,
  onPresetChange,
  onAutoLayout,
  onSave,
  onInvitesChange,
}: {
  preset: WorkspaceLayoutPreset
  canEdit: boolean
  presentationMode: boolean
  canInvite: boolean
  members: WorkspaceMemberOption[]
  invites: WorkspaceCollaborationInvite[]
  realtimeState: "connecting" | "live" | "degraded"
  isSaving: boolean
  roomName: string
  currentUser: {
    id: string
    name: string
    avatarUrl: string | null
  }
  onPresetChange: (nextPreset: WorkspaceLayoutPreset) => void
  onAutoLayout: () => void
  onSave: () => void
  onInvitesChange: (nextInvites: WorkspaceCollaborationInvite[]) => void
}) {
  const ModeIcon = presentationMode ? EyeIcon : LayoutGridIcon

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between rounded-xl border border-border/60 px-3 py-2 shadow-sm backdrop-blur",
        presentationMode ? "gap-2 bg-card/90" : "gap-3 bg-card/95",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-md border border-border/60 px-2 text-xs",
            presentationMode ? "bg-background/80 text-foreground" : "bg-background/70 text-muted-foreground",
          )}
        >
          <ModeIcon className="h-3.5 w-3.5" aria-hidden />
          {presentationMode ? "Board presentation" : "Workspace"}
        </span>

        {!presentationMode ? (
          <>
            <Select value={preset} onValueChange={(value) => onPresetChange(value as WorkspaceLayoutPreset)}>
              <SelectTrigger className="h-8 w-[150px]" aria-label="Layout preset" disabled={!canEdit}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRESET_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="button" variant="outline" size="sm" className="h-8" onClick={onAutoLayout} disabled={!canEdit}>
              <WandSparklesIcon className="h-3.5 w-3.5" aria-hidden />
              Auto layout
            </Button>
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <WorkspaceBoardCollaboration
          roomName={roomName}
          currentUser={currentUser}
          invites={invites}
          realtimeState={realtimeState}
          presentationMode={presentationMode}
        />
        {!presentationMode ? <CurrentUserAvatar /> : null}
        {!presentationMode ? (
          <>
            <WorkspaceBoardInviteSheet
              canInvite={canInvite}
              members={members}
              invites={invites}
              onInvitesChange={onInvitesChange}
            />

            <Button type="button" size="sm" className="h-8" onClick={onSave} disabled={!canEdit || isSaving}>
              {isSaving ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <CheckIcon className="h-3.5 w-3.5" aria-hidden />}
              Save layout
            </Button>
          </>
        ) : (
          <Button asChild type="button" variant="outline" size="sm" className="h-8">
            <Link href="/organization">
              <LayoutGridIcon className="h-3.5 w-3.5" aria-hidden />
              Edit workspace
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
