"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  canAccessOrganizationInCoachScope,
  loadOrganizationCoachActorScope,
} from "@/features/organization-coach-assignments"
import { hasPlatformCapability } from "@/features/platform-access"
import { resolveAuthenticatedAppContext } from "@/lib/auth/request-context"
import type {
  UpdateOrganizationKanbanVisibilityInput,
  UpdateOrganizationKanbanVisibilityResult,
} from "../types"

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  hidden: z.boolean(),
})

function isMissingPreferencesTable(error: { code?: string | null }) {
  return error.code === "42P01" || error.code === "PGRST205"
}

export async function updateOrganizationKanbanVisibilityAction(
  input: UpdateOrganizationKanbanVisibilityInput
): Promise<UpdateOrganizationKanbanVisibilityResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { error: "Choose a valid organization." }

  const { profileAudience, supabase, user } =
    await resolveAuthenticatedAppContext()
  const accessLevel = profileAudience.platformAccessLevel
  if (!hasPlatformCapability(accessLevel, "organizations")) {
    return { error: "Only platform staff can change Kanban visibility." }
  }

  const scope = await loadOrganizationCoachActorScope({
    accessLevel,
    supabase,
    userId: user.id,
  })
  if (!canAccessOrganizationInCoachScope(scope, parsed.data.organizationId)) {
    return { error: "Organization not found." }
  }

  const result = parsed.data.hidden
    ? await supabase.from("organization_staff_kanban_preferences").upsert(
        {
          staff_user_id: user.id,
          organization_id: parsed.data.organizationId,
          hidden_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "staff_user_id,organization_id" }
      )
    : await supabase
        .from("organization_staff_kanban_preferences")
        .delete()
        .eq("staff_user_id", user.id)
        .eq("organization_id", parsed.data.organizationId)

  if (result.error) {
    if (isMissingPreferencesTable(result.error)) {
      return { error: "Kanban visibility needs the latest database migration." }
    }
    if (result.error.code === "23503") {
      return { error: "Organization not found." }
    }
    console.error(
      "Unable to update organization Kanban visibility.",
      result.error
    )
    return { error: "Unable to update your Kanban visibility." }
  }

  revalidatePath("/organizations")
  return {
    ok: true,
    organizationId: parsed.data.organizationId,
    hidden: parsed.data.hidden,
  }
}
