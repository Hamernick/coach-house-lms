import { AuthCard } from "@/components/auth/auth-card"
import { AuthScreenShell } from "@/components/auth/auth-screen-shell"
import { UpdatePasswordForm } from "@/components/auth/update-password-form"

type SearchParams = Record<string, string | string[] | undefined>

type UpdatePasswordPageProps = {
  searchParams?: Promise<SearchParams>
}

function getSafeRedirect(value: unknown) {
  if (typeof value !== "string") return undefined
  if (!value.startsWith("/")) return undefined
  if (value.startsWith("//")) return undefined
  return value
}

export default async function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProps) {
  const resolved = searchParams ? await searchParams : {}
  const redirect = getSafeRedirect(resolved.redirect)

  return (
    <AuthScreenShell>
      <AuthCard
        title="Choose a new password"
        description="Passwords must be at least 8 characters."
      >
        <UpdatePasswordForm redirectTo={redirect ?? "/organization"} />
      </AuthCard>
    </AuthScreenShell>
  )
}
