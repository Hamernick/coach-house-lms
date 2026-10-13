import { NextResponse, type NextRequest } from "next/server"

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

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

  // Clear the active browser session cookie/token first.
  await supabase.auth.signOut()

  const admin = createSupabaseAdminClient()
  const { error: delError } = await admin.auth.admin.deleteUser(user.id)
  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 })
  }

  return response
}
