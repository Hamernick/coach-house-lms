import { AuthCard } from "@/components/auth/auth-card"
import { UpdatePasswordForm } from "@/components/auth/update-password-form"

type SearchParams = Record<string, string | string[] | undefined>

type UpdatePasswordPageProps = {
  searchParams?: Promise<SearchParams>
}

export default async function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProps) {
  const resolved = searchParams ? await searchParams : {}
  const redirect = typeof resolved.redirect === "string" ? resolved.redirect : undefined

  return (
    <AuthCard
      title="Choose a new password"
      description="Passwords must be at least 8 characters."
    >
      <UpdatePasswordForm redirectTo={redirect ?? "/dashboard"} />
    </AuthCard>
  )
}
