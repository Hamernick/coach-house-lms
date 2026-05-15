import { NextResponse, type NextRequest } from "next/server"

import { getAccountDeletionPreflight } from "@/lib/account-deletion/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"

export async function GET(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
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
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>()

  if (profileError) {
    return NextResponse.json(
      { error: "Unable to load account deletion status." },
      { status: 500 },
    )
  }

  try {
    const preflight = await getAccountDeletionPreflight({
      admin,
      userId: user.id,
      isAdmin: profile?.role === "admin",
    })
    return NextResponse.json({ preflight })
  } catch (preflightError) {
    return NextResponse.json(
      {
        error:
          preflightError instanceof Error
            ? preflightError.message
            : "Unable to load account deletion status.",
      },
      { status: 500 },
    )
  }
}
