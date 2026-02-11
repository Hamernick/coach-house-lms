import { redirect } from "next/navigation"

import { LoginPanel } from "@/components/auth/login-panel"
import { CaseStudyAutofillFab } from "@/components/dev/case-study-autofill-fab"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"

type SearchParams = Record<string, string | string[] | undefined>

type LoginPageProps = {
  searchParams?: Promise<SearchParams>
}

function getSafeRedirect(value: unknown) {
  if (typeof value !== "string") return undefined
  if (!value.startsWith("/")) return undefined
  if (value.startsWith("//")) return undefined
  return value
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolved = searchParams ? await searchParams : {}

  const redirectParam = getSafeRedirect(resolved.redirect)
  const redirectForSignedInUser = redirectParam
  const error = typeof resolved.error === "string" ? resolved.error : null

  const plan = typeof resolved.plan === "string" ? resolved.plan : undefined
  const addon = typeof resolved.addon === "string" ? resolved.addon : undefined
  const selectedPlan = plan === "organization" ? "organization" : plan === "individual" ? "individual" : null
  const selectedAddon = addon === "accelerator" ? "accelerator" : null

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw supabaseErrorToError(userError, "Unable to load user.")
  }

  if (user) {
    redirect(redirectForSignedInUser ?? "/my-organization")
  }

  const fallbackParams = new URLSearchParams()
  if (selectedPlan) fallbackParams.set("plan", selectedPlan)
  if (selectedAddon) fallbackParams.set("addon", selectedAddon)

  const fallbackQuery = fallbackParams.toString()
  const redirectTo = redirectParam ?? (fallbackQuery ? `/my-organization?${fallbackQuery}` : undefined)
  const signUpHref = redirectTo ? `/sign-up?redirect=${encodeURIComponent(redirectTo)}` : "/sign-up"

  return (
    <>
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col p-6 md:p-10">
          <div className="flex flex-1 items-center justify-center">
            <LoginPanel redirectTo={redirectTo} initialError={error} signUpHref={signUpHref} />
          </div>
        </div>
        <div className="relative hidden bg-muted lg:block">
          <img
            src="https://images.unsplash.com/photo-1602146057681-08560aee8cde"
            alt="Students collaborating during a workshop"
            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.75] dark:grayscale"
          />
        </div>
      </div>
      <CaseStudyAutofillFab allowToken />
    </>
  )
}
