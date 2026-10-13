import { redirect as redirectTo } from "next/navigation"

import { AuthCard } from "@/components/auth/auth-card"
import { AuthScreenShell } from "@/components/auth/auth-screen-shell"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"

type SearchParams = Record<string, string | string[] | undefined>

type TesterSignUpPageProps = {
  searchParams?: Promise<SearchParams>
}

function getSafeRedirect(value: unknown) {
  if (typeof value !== "string") return undefined
  if (!value.startsWith("/")) return undefined
  if (value.startsWith("//")) return undefined
  return value
}

export default async function TesterSignUpPage({ searchParams }: TesterSignUpPageProps) {
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
    redirectTo(redirect ?? "/organization")
  }

  const redirectTarget = redirect ?? "/organization"
  const loginHref = `/tester/login?redirect=${encodeURIComponent(redirectTarget)}`

  return (
    <AuthScreenShell>
      <AuthCard
        title="Tester sign up"
        description="Create a tester account. Billing, onboarding, and access flows stay identical to real users."
      >
        <SignUpForm
          redirectTo={redirectTarget}
          loginHref={loginHref}
          signUpMetadata={{ qa_tester: true }}
        />
      </AuthCard>
    </AuthScreenShell>
  )
}

