"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { resolveAuthenticatedAppContext } from "@/lib/auth/request-context"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type {
  UpdateOrganizationCoachAssignmentInput,
  UpdateOrganizationCoachAssignmentResult,
} from "../types"

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  coachUserId: z.string().uuid().nullable(),
})

function isMissingAssignmentsTable(error: { code?: string | null }) {
  return error.code === "42P01" || error.code === "PGRST205"
}

export async function updateOrganizationCoachAssignmentAction(
  input: UpdateOrganizationCoachAssignmentInput
): Promise<UpdateOrganizationCoachAssignmentResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success)
    return { error: "Select a valid organization and coach." }

  const { user, profileAudience } = await resolveAuthenticatedAppContext()
  if (profileAudience.platformAccessLevel !== "developer") {
    return { error: "Only developers can change coach assignments." }
  }

  const admin = createSupabaseAdminClient()
  const { data: organization } = await admin
    .from("organizations")
    .select("user_id")
    .eq("user_id", parsed.data.organizationId)
    .maybeSingle()
  if (!organization) return { error: "Organization not found." }

  let error = null
  if (parsed.data.coachUserId) {
    const { data: coach } = await admin
      .from("platform_staff_members")
      .select("user_id")
      .eq("user_id", parsed.data.coachUserId)
      .eq("access_level", "coach")
      .maybeSingle()
    if (!coach) return { error: "Select a coach-level staff member." }

    const result = await admin.from("organization_coach_assignments").upsert(
      {
        organization_id: parsed.data.organizationId,
        coach_user_id: parsed.data.coachUserId,
        assigned_by: user.id,
      },
      { onConflict: "organization_id" }
    )
    error = result.error
  } else {
    const result = await admin
      .from("organization_coach_assignments")
      .delete()
      .eq("organization_id", parsed.data.organizationId)
    error = result.error
  }

  if (error) {
    if (isMissingAssignmentsTable(error)) {
      return { error: "Assignments need the latest database migration." }
    }
    console.error("Unable to update organization coach assignment.", error)
    return { error: "Unable to update the coach assignment." }
  }

  revalidatePath("/organizations", "layout")
  return {
    ok: true,
    organizationId: parsed.data.organizationId,
    coachUserId: parsed.data.coachUserId,
  }
}
