import { redirect } from "next/navigation"

import { DEFAULT_POST_AUTH_REDIRECT, getSafeRedirectPath } from "@/lib/auth/redirects"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type SearchParams = Record<string, string | string[] | undefined>

type LoginPageProps = {
  searchParams?: Promise<SearchParams>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolved = searchParams ? await searchParams : {}
  const redirectParamRaw = Array.isArray(resolved.redirect) ? resolved.redirect[0] : resolved.redirect
  const redirectParam = getSafeRedirectPath(redirectParamRaw)
  const error = Array.isArray(resolved.error) ? resolved.error[0] : resolved.error
  const notice = Array.isArray(resolved.notice) ? resolved.notice[0] : resolved.notice
  const plan = Array.isArray(resolved.plan) ? resolved.plan[0] : resolved.plan
  const addon = Array.isArray(resolved.addon) ? resolved.addon[0] : resolved.addon

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect(redirectParam ?? DEFAULT_POST_AUTH_REDIRECT)
  }

  const params = new URLSearchParams()
  params.set("section", "login")

  if (redirectParam) params.set("redirect", redirectParam)
  if (typeof error === "string" && error.length > 0) params.set("error", error)
  if (notice === "email_confirmed_sign_in") params.set("notice", notice)
  if (plan === "organization" || plan === "individual") params.set("plan", plan)
  if (addon === "accelerator") params.set("addon", addon)

  redirect(`/?${params.toString()}`)
}
