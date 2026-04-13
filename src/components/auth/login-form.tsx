"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useSupabaseClient } from "@/hooks/use-supabase-client"
import { DEFAULT_POST_AUTH_REDIRECT, getSafeRedirectPath } from "@/lib/auth/redirects"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/auth/password-input"

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormValues = z.infer<typeof schema>

type LoginFormProps = {
  redirectTo?: string
  initialError?: string | null
  signUpHref?: string
}

function mapAuthErrorMessage(raw: string | null | undefined) {
  if (!raw) return null
  const normalized = raw.toLowerCase()

  if (
    normalized.includes("pkce code verifier") ||
    normalized.includes("code verifier not found in storage")
  ) {
    return "Email confirmed. Sign in to continue."
  }
  if (
    normalized.includes("invalid refresh token") ||
    normalized.includes("refresh token not found")
  ) {
    return "Session expired. Please sign in again."
  }
  if (normalized.includes("missing verification code")) {
    return "This verification link is incomplete. Request a new link and try again."
  }

  return raw
}

function mapAuthNoticeMessage(raw: string | null | undefined) {
  if (!raw) return null
  switch (raw) {
    case "email_confirmed_sign_in":
      return "Email confirmed. Sign in to continue."
    default:
      return null
  }
}

export function LoginForm({ redirectTo, initialError, signUpHref }: LoginFormProps) {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchError = mapAuthErrorMessage(searchParams.get("error"))
  const noticeMessage = mapAuthNoticeMessage(searchParams.get("notice"))
  const redirectFromSearch = getSafeRedirectPath(searchParams.get("redirect"))
  const resolvedRedirectTo =
    redirectFromSearch ?? getSafeRedirectPath(redirectTo) ?? DEFAULT_POST_AUTH_REDIRECT
  const [errorMessage, setErrorMessage] = useState<string | null>(
    mapAuthErrorMessage(initialError) ?? searchError,
  )
  const [isPending, startTransition] = useTransition()
  const resolvedSignUpHref = useMemo(() => {
    const base = signUpHref ?? "/sign-up"
    if (!resolvedRedirectTo || base.includes("redirect=")) return base
    const separator = base.includes("?") ? "&" : "?"
    return `${base}${separator}redirect=${encodeURIComponent(resolvedRedirectTo)}`
  }, [resolvedRedirectTo, signUpHref])
  const resolvedForgotPasswordHref = useMemo(() => {
    const base = "/forgot-password"
    if (!resolvedRedirectTo) return base
    return `${base}?redirect=${encodeURIComponent(resolvedRedirectTo)}`
  }, [resolvedRedirectTo])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  })
  const isConfirmationMessage = errorMessage === "Email confirmed. Sign in to continue."

  useEffect(() => {
    setErrorMessage(mapAuthErrorMessage(initialError) ?? searchError)
  }, [initialError, searchError])

  async function onSubmit(values: LoginFormValues) {
    setErrorMessage(null)

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        setErrorMessage(mapAuthErrorMessage(error.message))
        return
      }

      form.reset()
      router.replace(resolvedRedirectTo)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" autoComplete="email" placeholder="you@example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput {...field} autoComplete="current-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {errorMessage ? (
            <p
              className={
                isConfirmationMessage
                  ? "text-sm text-emerald-600 dark:text-emerald-400"
                  : "text-sm text-destructive"
              }
              role={isConfirmationMessage ? "status" : "alert"}
            >
              {errorMessage}
            </p>
          ) : noticeMessage ? (
            <p className="text-sm text-emerald-600" role="status">
              {noticeMessage}
            </p>
          ) : null}
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Form>
      <div className="flex justify-between text-sm text-muted-foreground">
        <Link href={resolvedSignUpHref} className="hover:text-foreground">
          Need an account? Sign up
        </Link>
        <Link href={resolvedForgotPasswordHref} className="hover:text-foreground">
          Forgot password?
        </Link>
      </div>
    </div>
  )
}
