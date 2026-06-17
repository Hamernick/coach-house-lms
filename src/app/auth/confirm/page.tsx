import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AuthCard } from "@/components/auth/auth-card"
import { AuthScreenShell } from "@/components/auth/auth-screen-shell"
import { Button } from "@/components/ui/button"
import {
  buildLoginUrlWithAuthConfirmationError,
  getSafeEmailOtpType,
  resolvePostAuthConfirmationRedirect,
  resolveAuthConfirmationDestination,
} from "@/lib/supabase/auth-confirmation"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function safeOrigin(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.length === 0) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

async function resolveRequestOrigin() {
  const headerStore = await headers()
  const proto = headerStore.get("x-forwarded-proto") ?? "https"
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host")
  return host ? `${proto}://${host}` : null
}

async function confirmEmailAction(formData: FormData) {
  "use server"

  const tokenHash = formData.get("token_hash")
  const type = getSafeEmailOtpType(formData.get("type"))
  const destination = resolveAuthConfirmationDestination(formData.get("destination"))
  const requestOrigin = safeOrigin(formData.get("request_origin")) ?? (await resolveRequestOrigin())

  if (typeof tokenHash !== "string" || tokenHash.length === 0 || !type) {
    redirect(
      buildLoginUrlWithAuthConfirmationError({
        destination,
        message: "This confirmation link is missing verification details. Request a new link.",
      }),
    )
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  })

  if (error) {
    redirect(
      buildLoginUrlWithAuthConfirmationError({
        destination,
        message: "This confirmation link is invalid or expired. Request a new link.",
      }),
    )
  }

  redirect(resolvePostAuthConfirmationRedirect(destination, requestOrigin))
}

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const resolved = searchParams ? await searchParams : {}
  const tokenHash = firstParam(resolved.token_hash)
  const type = getSafeEmailOtpType(firstParam(resolved.type))
  const origin = await resolveRequestOrigin()
  const destination = resolveAuthConfirmationDestination(firstParam(resolved.next), origin)
  const canConfirm = Boolean(tokenHash && type)

  return (
    <AuthScreenShell>
      <AuthCard
        title={canConfirm ? "Confirm your email" : "Confirmation link unavailable"}
        description={
          canConfirm
            ? "Finish securing your Coach House account before continuing."
            : "This link is missing the verification details needed to confirm an account."
        }
      >
        {canConfirm ? (
          <form action={confirmEmailAction} className="space-y-4">
            <input type="hidden" name="token_hash" value={tokenHash ?? ""} />
            <input type="hidden" name="type" value={type ?? ""} />
            <input type="hidden" name="destination" value={destination} />
            <input type="hidden" name="request_origin" value={origin ?? ""} />
            <Button type="submit" className="w-full">
              Confirm email
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              After confirmation, Coach House will continue to your next step.
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/sign-up">Create account</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/login">Go to sign in</Link>
            </Button>
          </div>
        )}
      </AuthCard>
    </AuthScreenShell>
  )
}
