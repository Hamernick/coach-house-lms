import { redirect } from "next/navigation"

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
  const redirectParamRaw = Array.isArray(resolved.redirect) ? resolved.redirect[0] : resolved.redirect
  const redirectParam = getSafeRedirect(redirectParamRaw)
  const error = Array.isArray(resolved.error) ? resolved.error[0] : resolved.error
  const plan = Array.isArray(resolved.plan) ? resolved.plan[0] : resolved.plan
  const addon = Array.isArray(resolved.addon) ? resolved.addon[0] : resolved.addon

  const params = new URLSearchParams()
  params.set("section", "login")

  if (redirectParam) params.set("redirect", redirectParam)
  if (typeof error === "string" && error.length > 0) params.set("error", error)
  if (plan === "organization" || plan === "individual") params.set("plan", plan)
  if (addon === "accelerator") params.set("addon", addon)

  redirect(`/?${params.toString()}`)
}
