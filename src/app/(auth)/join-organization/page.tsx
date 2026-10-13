import Link from "next/link"
import { redirect } from "next/navigation"

import { acceptOrganizationInviteAction } from "@/app/actions/organization-access"
import { Button } from "@/components/ui/button"
import { createSupabaseServerClient } from "@/lib/supabase"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"

export const dynamic = "force-dynamic"

export default async function JoinOrganizationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const tokenParam = typeof resolvedSearchParams?.token === "string" ? resolvedSearchParams.token.trim() : ""

  if (!tokenParam) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Join organization</h1>
          <p className="text-sm text-muted-foreground">This invite link is missing a token.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/login">Go to login</Link>
        </Button>
      </div>
    )
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw supabaseErrorToError(userError, "Unable to load user.")
  }

  if (!user) {
    const redirectPath = `/join-organization?token=${encodeURIComponent(tokenParam)}`
    redirect(`/login?redirect=${encodeURIComponent(redirectPath)}`)
  }

  const result = await acceptOrganizationInviteAction(tokenParam)
  if ("error" in result) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Invite could not be accepted</h1>
          <p className="text-sm text-muted-foreground">{result.error}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/organization">Go to Organization</Link>
          </Button>
        </div>
      </div>
    )
  }

  redirect("/organization?joined=1")
}
