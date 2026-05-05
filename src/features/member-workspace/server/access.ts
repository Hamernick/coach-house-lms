import { redirect } from "next/navigation"

import {
  actorHasMemberWorkspaceAccess,
  ensureMemberWorkspaceFeatureAccess,
  MEMBER_WORKSPACE_UPGRADE_MESSAGE,
} from "@/lib/workspace/member-workspace-access"
import { getMemberWorkspacePaywallPath } from "@/lib/workspace/routes"

import { resolveMemberWorkspaceActorContext } from "./member-workspace-actor-context"

export {
  actorHasMemberWorkspaceAccess,
  ensureMemberWorkspaceFeatureAccess,
  MEMBER_WORKSPACE_UPGRADE_MESSAGE,
}

export async function requireMemberWorkspacePageAccess(source: string) {
  const actor = await resolveMemberWorkspaceActorContext()
  if (actorHasMemberWorkspaceAccess(actor)) return actor

  redirect(getMemberWorkspacePaywallPath(source))
}
