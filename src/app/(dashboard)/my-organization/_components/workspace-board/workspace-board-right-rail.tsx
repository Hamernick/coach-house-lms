"use client"

import { memo, useMemo } from "react"
import Link from "next/link"
import Clock3Icon from "lucide-react/dist/esm/icons/clock-3"
import FileTextIcon from "lucide-react/dist/esm/icons/file-text"
import LayoutGridIcon from "lucide-react/dist/esm/icons/layout-grid"
import PlusIcon from "lucide-react/dist/esm/icons/plus"

import { RightRailSlot } from "@/components/app-shell/right-rail"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { cn } from "@/lib/utils"

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

const RAIL_SECTION_CLASSNAME = "space-y-2 px-0.5"
const PRESET_ORDER: WorkspaceLayoutPreset[] = ["balanced", "calendar-focused", "communications-focused"]
const PRESET_ICON_BY_ID: Record<WorkspaceLayoutPreset, typeof LayoutGridIcon> = {
  balanced: LayoutGridIcon,
  "calendar-focused": Clock3Icon,
  "communications-focused": FileTextIcon,
}

function toInitials(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts.at(-1)!.slice(0, 1)}`.toUpperCase()
}

function hueFromSeed(seed: string) {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash) % 360
}

type AccessPerson = {
  id: string
  name: string
  subtitle: string
  avatarUrl: string | null
}

export const WorkspaceBoardRightRail = memo(function WorkspaceBoardRightRail({
  preset,
  canEdit,
  canInvite,
  members,
  invites,
  realtimeState,
  currentUser,
  onPresetChange,
  onInvitesChange,
}: {
  preset: WorkspaceLayoutPreset
  canEdit: boolean
  canInvite: boolean
  members: WorkspaceMemberOption[]
  invites: WorkspaceCollaborationInvite[]
  realtimeState: "connecting" | "live" | "degraded"
  currentUser: {
    id: string
    name: string
    avatarUrl: string | null
  }
  onPresetChange: (nextPreset: WorkspaceLayoutPreset) => void
  onInvitesChange: (nextInvites: WorkspaceCollaborationInvite[]) => void
}) {
  const nowMs = Date.now()
  const activeInviteCount = invites.filter((invite) => {
    if (invite.revokedAt) return false
    const expiresAt = new Date(invite.expiresAt).getTime()
    return Number.isFinite(expiresAt) && expiresAt > nowMs
  }).length

  const accessPeople = useMemo<AccessPerson[]>(() => {
    const next: AccessPerson[] = []
    const seen = new Set<string>()

    const pushPerson = (person: AccessPerson) => {
      if (seen.has(person.id)) return
      seen.add(person.id)
      next.push(person)
    }

    pushPerson({
      id: currentUser.id,
      name: currentUser.name || "You",
      subtitle: "You",
      avatarUrl: currentUser.avatarUrl,
    })

    for (const member of members) {
      pushPerson({
        id: member.userId,
        name: member.name?.trim() || member.email || "Member",
        subtitle: member.isOwner ? "Owner" : member.role,
        avatarUrl: member.avatarUrl,
      })
    }

    return next
  }, [currentUser.avatarUrl, currentUser.id, currentUser.name, members])

  const visiblePeople = accessPeople.slice(0, 4)
  const extraPeopleCount = Math.max(0, accessPeople.length - visiblePeople.length)
  const realtimeLabel =
    realtimeState === "live" ? "Live" : realtimeState === "connecting" ? "Connecting…" : "Realtime degraded"

  return (
    <>
      <RightRailSlot priority={10}>
        <div className="space-y-4">
          <section className={RAIL_SECTION_CLASSNAME} aria-label="Team access">
            <p className="px-1 text-sm font-medium text-foreground">
              Team Access
            </p>

            <div className="flex items-center gap-2">
                <HoverCard openDelay={150} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto min-w-0 flex-1 rounded-full border border-border/65 bg-card px-2 py-1.5 text-left shadow-xs transition-colors hover:bg-muted/20"
                    aria-label="Team access details"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center">
                        <div className="flex -space-x-2 pr-1">
                          {visiblePeople.map((person) => {
                            const hue = hueFromSeed(person.id)
                            return (
                              <Avatar
                                key={person.id}
                                className="h-7 w-7 border-2 border-card"
                                title={`${person.name} · ${person.subtitle}`}
                                aria-label={person.name}
                              >
                                {person.avatarUrl ? <AvatarImage src={person.avatarUrl} alt={person.name} /> : null}
                                <AvatarFallback
                                  className="text-[10px] font-semibold"
                                  style={{
                                    backgroundColor: `hsl(${hue} 28% 88%)`,
                                    color: `hsl(${hue} 32% 26%)`,
                                  }}
                                >
                                  {toInitials(person.name)}
                                </AvatarFallback>
                              </Avatar>
                            )
                          })}
                          {extraPeopleCount > 0 ? (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold text-muted-foreground">
                              +{extraPeopleCount}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pr-1 text-[11px] text-muted-foreground">
                        <span
                          aria-hidden
                          className={cn(
                            "h-1.5 w-1.5 rounded-full bg-muted-foreground/70",
                            realtimeState === "live" && "bg-emerald-500",
                            realtimeState === "connecting" && "animate-pulse",
                            realtimeState === "degraded" && "bg-amber-500",
                          )}
                        />
                        <span className="truncate">{realtimeLabel}</span>
                      </div>
                    </div>
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent align="start" side="bottom" className="w-[22rem] rounded-xl p-0">
                  <div className="border-b border-border/60 px-3 py-2.5">
                    <p className="text-sm font-semibold">Team access</p>
                    <p className="text-xs text-muted-foreground">
                      People with access to this workspace and temporary invite status.
                    </p>
                  </div>

                  <div className="max-h-72 space-y-1 overflow-y-auto p-2">
                    {accessPeople.slice(0, 8).map((person) => {
                      const hue = hueFromSeed(person.id)
                      return (
                        <div
                          key={person.id}
                          className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 px-2.5 py-2"
                        >
                          <Avatar className="h-8 w-8 border border-border/50">
                            {person.avatarUrl ? <AvatarImage src={person.avatarUrl} alt={person.name} /> : null}
                            <AvatarFallback
                              className="text-[10px] font-semibold"
                              style={{
                                backgroundColor: `hsl(${hue} 28% 88%)`,
                                color: `hsl(${hue} 32% 26%)`,
                              }}
                            >
                              {toInitials(person.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{person.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{person.subtitle}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2.5">
                    <div className="text-xs text-muted-foreground">
                      <span className="tabular-nums">{activeInviteCount}</span> active{" "}
                      {activeInviteCount === 1 ? "invite" : "invites"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <WorkspaceBoardInviteSheet
                        canInvite={canInvite}
                        members={members}
                        invites={invites}
                        onInvitesChange={onInvitesChange}
                        triggerVariant="ghost"
                        triggerClassName="h-8 rounded-md px-2.5"
                      />
                      <Button asChild variant="ghost" size="sm" className="h-8 rounded-md px-2.5">
                        <Link href="/organization?view=editor&tab=people">Manage members</Link>
                      </Button>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>

              <WorkspaceBoardInviteSheet
                canInvite={canInvite}
                members={members}
                invites={invites}
                onInvitesChange={onInvitesChange}
                triggerSize="icon"
                triggerVariant="outline"
                triggerAriaLabel="Invite collaborator"
                triggerContent={<PlusIcon className="h-4 w-4" aria-hidden />}
                triggerClassName="h-9 w-9 rounded-full border-border/65 bg-card p-0"
              />
            </div>

            <p className="px-1 text-xs text-muted-foreground">
              <span className="tabular-nums">{accessPeople.length}</span>{" "}
              {accessPeople.length === 1 ? "member" : "members"} ·{" "}
              <span className="tabular-nums">{activeInviteCount}</span> active{" "}
              {activeInviteCount === 1 ? "invite" : "invites"}
            </p>
          </section>

          {canEdit ? (
            <section className={RAIL_SECTION_CLASSNAME} aria-label="Board layout">
              <p className="px-1 text-sm font-medium text-foreground">
                Board layout
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_ORDER.map((presetId) => {
                  const Icon = PRESET_ICON_BY_ID[presetId]
                  const selected = preset === presetId
                  return (
                    <Button
                      key={presetId}
                      type="button"
                      variant={selected ? "secondary" : "outline"}
                      size="icon"
                      className={cn(
                        "h-9 w-full rounded-lg border-border/70 bg-card",
                        selected && "bg-accent text-accent-foreground",
                      )}
                      aria-label={`Apply ${PRESET_LABELS[presetId]} layout`}
                      aria-pressed={selected}
                      title={PRESET_LABELS[presetId]}
                      onClick={() => onPresetChange(presetId)}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </Button>
                  )
                })}
              </div>
              <div className="px-1">
                <p className="text-xs text-foreground">{WORKSPACE_LAYOUT_PRESET_META[preset].shortLabel}</p>
                <p className="text-[11px] text-muted-foreground">{WORKSPACE_LAYOUT_PRESET_META[preset].algorithmLabel}</p>
              </div>
            </section>
          ) : null}
        </div>
      </RightRailSlot>

    </>
  )
})

WorkspaceBoardRightRail.displayName = "WorkspaceBoardRightRail"
