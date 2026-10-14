"use client"

import { Cursor } from "@/components/cursor"
import { organizationWorkspaceSupportEnabled } from "@/lib/feature-flags"
import { useOrganizationWorkspaceSupportController } from "../hooks/use-organization-workspace-support-controller"

export function OrganizationWorkspaceSupportPanel({ organizationId, supportAccess = false }: { organizationId: string; supportAccess?: boolean }) {
  const { participants, error, sessionId, path } = useOrganizationWorkspaceSupportController(organizationId, supportAccess)
  if (!organizationWorkspaceSupportEnabled) return null
  const others = participants.filter((participant) => participant.session_id !== sessionId)
  const people = [...new Map(others.map((participant) => [participant.actor_id, participant])).values()]
  return <>
    {supportAccess ? <p className="px-1 text-xs text-muted-foreground" role="status">Coach House support · Temporary workspace</p> : null}
    {people.length ? <p className="px-1 text-xs text-muted-foreground" role="status">
      {people.map((participant) => `${participant.name} (${participant.editing ? "editing" : "viewing"})`).join(", ")} · Coach House support
    </p> : null}
    {error && supportAccess ? <p className="px-1 text-xs text-destructive" role="alert">{error}</p> : null}
    {others.filter((participant) => participant.path === path && participant.position).map((participant) => <Cursor
      key={participant.session_id} name={`${participant.name} · Support`} color="#2563eb"
      className="pointer-events-none fixed z-50"
      style={{ left: `${participant.position!.x * 100}vw`, top: `${participant.position!.y * 100}vh` }}
    />)}
  </>
}
