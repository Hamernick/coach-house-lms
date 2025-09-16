import { AuthCard } from "@/components/auth/auth-card"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

type SearchParams = Record<string, string | string[] | undefined>

type ForgotPasswordPageProps = {
  searchParams?: Promise<SearchParams>
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const resolved = searchParams ? await searchParams : {}
  const redirect = typeof resolved.redirect === "string" ? resolved.redirect : undefined

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we'll send a secure link to choose a new password."
    >
      <ForgotPasswordForm redirectTo={redirect} />
    </AuthCard>
  )
}
