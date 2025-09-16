import { AuthCard } from "@/components/auth/auth-card"
import { LoginForm } from "@/components/auth/login-form"

type SearchParams = Record<string, string | string[] | undefined>

type LoginPageProps = {
  searchParams?: Promise<SearchParams>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolved = searchParams ? await searchParams : {}

  const redirect = typeof resolved.redirect === "string" ? resolved.redirect : undefined
  const error = typeof resolved.error === "string" ? resolved.error : null

  return (
    <AuthCard
      title="Sign in"
      description="Access your courses and continue where you left off."
    >
      <LoginForm redirectTo={redirect} initialError={error} />
    </AuthCard>
  )
}
