import { AuthCard } from "@/components/auth/auth-card"
import { SignUpForm } from "@/components/auth/sign-up-form"

type SearchParams = Record<string, string | string[] | undefined>

type SignUpPageProps = {
  searchParams?: Promise<SearchParams>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const resolved = searchParams ? await searchParams : {}
  const redirect = typeof resolved.redirect === "string" ? resolved.redirect : undefined

  return (
    <AuthCard
      title="Create your account"
      description="Join Coach House to access premium learning paths."
    >
      <SignUpForm redirectTo={redirect} />
    </AuthCard>
  )
}
