import { AuthCard } from "@/components/auth/auth-card"
import { AuthScreenShell } from "@/components/auth/auth-screen-shell"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { redirect as redirectTo } from "next/navigation"

type SearchParams = Record<string, string | string[] | undefined>

type SignUpPageProps = {
  searchParams?: Promise<SearchParams>
}

function getSafeRedirect(value: unknown) {
  if (typeof value !== "string") return undefined
  if (!value.startsWith("/")) return undefined
  if (value.startsWith("//")) return undefined
  return value
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const resolved = searchParams ? await searchParams : {}
  const redirect = getSafeRedirect(resolved.redirect)

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error && !isSupabaseAuthSessionMissingError(error)) {
    throw supabaseErrorToError(error, "Unable to load user.")
  }
  if (user) {
    const destination = redirect ?? "/organization"
    redirectTo(destination)
  }

  const plan = typeof resolved.plan === "string" ? resolved.plan : undefined
  const addon = typeof resolved.addon === "string" ? resolved.addon : undefined
  const selectedPlan = plan === "organization" ? "organization" : plan === "individual" ? "individual" : null
  const selectedAddon = addon === "accelerator" ? "accelerator" : null

  const fallbackParams = new URLSearchParams()
  if (selectedPlan) fallbackParams.set("plan", selectedPlan)
  if (selectedAddon) fallbackParams.set("addon", selectedAddon)

  const fallbackQuery = fallbackParams.toString()
  const redirectTarget = redirect ?? (fallbackQuery ? `/organization?${fallbackQuery}` : "/organization")
  const loginHref = `/login?redirect=${encodeURIComponent(redirectTarget)}`

  return (
    <AuthScreenShell>
      <AuthCard
        title="Create your account"
        description="Join Coach House to access premium learning paths."
      >
        <SignUpForm redirectTo={redirectTarget} loginHref={loginHref} />
      </AuthCard>
    </AuthScreenShell>
  )
}
