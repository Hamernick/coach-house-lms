import { NextResponse, type NextRequest } from "next/server"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  deleteOwnedOrganizationForAccountDeletion,
  isLikelyForeignKeyDeleteError,
  reassignSharedWorkspaceAuthorReferences,
} from "@/lib/account-deletion/server"

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
