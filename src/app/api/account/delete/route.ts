import { NextResponse, type NextRequest } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase"

const WORKSPACE_AUTHOR_TABLES = [
  "organization_project_assets",
  "organization_project_quick_links",
  "organization_project_notes",
  "organization_task_assignees",
  "organization_tasks",
  "organization_projects",
] as const

type AdminClient = SupabaseClient<Database, "public">

type DeleteUserError = {
  message?: string
}

function resolveSupabaseErrorMessage(error: { message?: string } | null | undefined) {
  return typeof error?.message === "string" && error.message.trim().length > 0
    ? error.message
    : "Unable to delete account."
}

function isLikelyForeignKeyDeleteError(error: DeleteUserError | null | undefined) {
  const message = error?.message?.toLowerCase() ?? ""
  return message.includes("foreign key") || message.includes("violates")
}

async function deleteOwnedOrganizationForAccountDeletion(admin: AdminClient, userId: string) {
  const { error: ownedOrgDeleteError } = await admin
    .from("organizations")
    .delete()
    .eq("user_id", userId)

  if (ownedOrgDeleteError) {
    throw new Error(resolveSupabaseErrorMessage(ownedOrgDeleteError))
  }
}

async function reassignSharedWorkspaceAuthorReferences(admin: AdminClient, userId: string) {
  for (const table of WORKSPACE_AUTHOR_TABLES) {
    const { data, error } = await admin
      .from(table)
      .select("org_id")
      .eq("created_by", userId)
      .neq("org_id", userId)
      .returns<Array<{ org_id: string }>>()

    if (error) {
      throw new Error(resolveSupabaseErrorMessage(error))
    }

    const orgIds = Array.from(new Set((data ?? []).map((row) => row.org_id)))
    for (const orgId of orgIds) {
      const { error: updateError } = await admin
        .from(table)
        .update({ created_by: orgId })
        .eq("created_by", userId)
        .eq("org_id", orgId)

      if (updateError) {
        throw new Error(resolveSupabaseErrorMessage(updateError))
      }
    }
  }
}

export async function DELETE(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 })
  const supabase = createSupabaseRouteHandlerClient(request, response)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createSupabaseAdminClient()
  try {
    await reassignSharedWorkspaceAuthorReferences(admin, user.id)
  } catch (cleanupError) {
    return NextResponse.json(
      {
        error:
          cleanupError instanceof Error
            ? cleanupError.message
            : "Unable to prepare account data for deletion.",
      },
      { status: 500 },
    )
  }

  let { error: delError } = await admin.auth.admin.deleteUser(user.id)
  if (delError && isLikelyForeignKeyDeleteError(delError)) {
    try {
      await deleteOwnedOrganizationForAccountDeletion(admin, user.id)
    } catch (cleanupError) {
      return NextResponse.json(
        {
          error:
            cleanupError instanceof Error
              ? cleanupError.message
              : "Unable to prepare account data for deletion.",
        },
        { status: 500 },
      )
    }
    const retryDeleteResult = await admin.auth.admin.deleteUser(user.id)
    delError = retryDeleteResult.error
  }
  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 })
  }

  // Clear the active browser session cookie/token after deletion succeeds.
  await supabase.auth.signOut()

  return response
}
