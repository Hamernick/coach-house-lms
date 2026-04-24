import { AuthCard } from "@/components/auth/auth-card"
import { AuthScreenShell } from "@/components/auth/auth-screen-shell"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { redirect as redirectTo } from "next/navigation"
import type { IntentFocus } from "@/components/onboarding/onboarding-dialog/types"

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

function getSafeIntent(value: unknown): IntentFocus | undefined {
  if (
    value === "build" ||
    value === "find" ||
    value === "fund" ||
    value === "support"
  ) {
    return value
  }
  return undefined
}

function buildCanonicalSignUpHref(searchParams: SearchParams) {
  const nextParams = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "plan" && value === "individual") continue

    if (typeof value === "string") {
      nextParams.set(key, value)
      continue
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        nextParams.append(key, item)
      }
    }
  }

  const query = nextParams.toString()
  return query ? `/sign-up?${query}` : "/sign-up"
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const resolved = searchParams ? await searchParams : {}
  if (resolved.plan === "individual") {
    redirectTo(buildCanonicalSignUpHref(resolved))
  }

  const redirect = getSafeRedirect(resolved.redirect)
  const explicitIntent = getSafeIntent(resolved.intent)
  const plan = typeof resolved.plan === "string" ? resolved.plan : undefined
  const tier = typeof resolved.tier === "string" ? resolved.tier : undefined
  const addon = typeof resolved.addon === "string" ? resolved.addon : undefined
  const selectedPlan = plan === "organization" ? "organization" : plan === "individual" ? "individual" : null
  const selectedAddon = addon === "accelerator" ? "accelerator" : null
  const defaultIntentFocus =
    explicitIntent ??
    (selectedPlan === "organization" || tier === "operations" || selectedAddon === "accelerator"
      ? "build"
      : "find")

  const fallbackParams = new URLSearchParams()
  if (selectedPlan) fallbackParams.set("plan", selectedPlan)
  if (selectedAddon) fallbackParams.set("addon", selectedAddon)

  const fallbackQuery = fallbackParams.toString()
  const builderRedirectTarget = redirect ?? "/onboarding?source=signup"
  const memberRedirectTarget =
    redirect ??
    (fallbackQuery ? `/find?member_onboarding=1&source=signup&${fallbackQuery}` : "/find?member_onboarding=1&source=signup")

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error && !isSupabaseAuthSessionMissingError(error)) {
    throw supabaseErrorToError(error, "Unable to load user.")
  }
  if (user) {
    const destination =
      defaultIntentFocus === "build"
        ? builderRedirectTarget
        : memberRedirectTarget
    redirectTo(destination)
  }
  const loginHref = `/login`

  return (
    <AuthScreenShell>
      <AuthCard
        title="Create your account"
        description="Choose whether you are building, finding, funding, or supporting nonprofit work."
      >
        <SignUpForm
          loginHref={loginHref}
          defaultIntentFocus={defaultIntentFocus}
          builderRedirectTo={builderRedirectTarget}
          memberRedirectTo={memberRedirectTarget}
        />
      </AuthCard>
    </AuthScreenShell>
  )
}
