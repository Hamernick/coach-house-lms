"use client"

import Link from "next/link"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"

import { useSupabaseClient } from "@/hooks/use-supabase-client"

type LoginSupabaseUiPanelProps = {
  redirectTo: string
  signUpHref: string
  initialError?: string | null
  initialNotice?: string | null
}

function resolveBrowserCallbackUrl(redirectTo: string) {
  if (typeof window === "undefined") return undefined
  const redirect = encodeURIComponent(redirectTo)
  return `${window.location.origin}/auth/callback?redirect=${redirect}`
}

function mapNotice(raw: string | null | undefined) {
  if (!raw) return null
  if (raw === "email_confirmed_sign_in") {
    return "Email confirmed. Sign in to continue."
  }
  return null
}

export function LoginSupabaseUiPanel({
  redirectTo,
  signUpHref,
  initialError,
  initialNotice,
}: LoginSupabaseUiPanelProps) {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const callbackUrl = useMemo(
    () => resolveBrowserCallbackUrl(redirectTo),
    [redirectTo],
  )
  const notice = mapNotice(initialNotice)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN") return
      router.replace(redirectTo)
      router.refresh()
    })
    return () => subscription.unsubscribe()
  }, [redirectTo, router, supabase.auth])

  return (
    <div className="space-y-4">
      {initialError ? (
        <p className="text-sm text-destructive" role="alert">
          {initialError}
        </p>
      ) : null}
      {notice ? (
        <p className="text-sm text-emerald-600" role="status">
          {notice}
        </p>
      ) : null}

      <Auth
        supabaseClient={supabase}
        view="sign_in"
        showLinks={false}
        providers={[]}
        redirectTo={callbackUrl}
        appearance={{
          theme: ThemeSupa,
          style: {
            button: {
              borderRadius: "0.5rem",
            },
            input: {
              borderRadius: "0.5rem",
            },
          },
        }}
      />

      <div className="flex justify-between text-sm text-muted-foreground">
        <Link href={signUpHref} className="hover:text-foreground">
          Need an account? Sign up
        </Link>
        <Link href="/forgot-password" className="hover:text-foreground">
          Forgot password?
        </Link>
      </div>
    </div>
  )
}

