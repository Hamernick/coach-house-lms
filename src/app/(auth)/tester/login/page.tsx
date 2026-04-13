import { redirect as redirectTo } from "next/navigation"

import { AuthCard } from "@/components/auth/auth-card"
import { AuthScreenShell } from "@/components/auth/auth-screen-shell"
import { LoginPanel } from "@/components/auth/login-panel"
import { DEFAULT_POST_AUTH_REDIRECT, getSafeRedirectPath } from "@/lib/auth/redirects"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"

type SearchParams = Record<string, string | string[] | undefined>

type TesterLoginPageProps = {
  searchParams?: Promise<SearchParams>
}

export default async function TesterLoginPage({ searchParams }: TesterLoginPageProps) {
  const resolved = searchParams ? await searchParams : {}
  const redirect = getSafeRedirectPath(resolved.redirect)
  const initialError = typeof resolved.error === "string" ? resolved.error : null

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) {
    throw supabaseErrorToError(error, "Unable to load user.")
  }

  if (user) {
    redirectTo(redirect ?? DEFAULT_POST_AUTH_REDIRECT)
  }

  const signUpHref = redirect
    ? `/tester/sign-up?redirect=${encodeURIComponent(redirect)}`
    : "/tester/sign-up"

  return (
    <AuthScreenShell>
      <AuthCard
        title="Tester sign in"
        description="Internal tester access for validating onboarding, billing, and workspace flows."
      >
        <LoginPanel
          redirectTo={redirect ?? DEFAULT_POST_AUTH_REDIRECT}
          initialError={initialError}
          signUpHref={signUpHref}
          className="max-w-none"
        />
      </AuthCard>
    </AuthScreenShell>
  )
}
