"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useSupabaseClient } from "@/hooks/use-supabase-client"
import { createTesterAccountAction } from "@/app/(auth)/tester/sign-up/actions"
import { resolveAuthCallbackUrl } from "@/components/auth/auth-callback-url"
import type { IntentFocus } from "@/components/onboarding/onboarding-dialog/types"
import { PasswordInput } from "@/components/auth/password-input"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const DEFAULT_BUILDER_REDIRECT = "/workspace?onboarding_flow=1&source=signup"
const DEFAULT_MEMBER_REDIRECT = "/find?member_onboarding=1&source=signup"

const JOURNEY_OPTIONS: Array<{
  value: IntentFocus
  label: string
  description: string
}> = [
  {
    value: "build",
    label: "Build a nonprofit",
    description: "Create your organization workspace and unlock builder onboarding.",
  },
  {
    value: "find",
    label: "Find nonprofits",
    description: "Save organizations, follow your interests, and stay connected.",
  },
  {
    value: "fund",
    label: "Fund nonprofits",
    description: "Track organizations you support and review funder-ready updates.",
  },
  {
    value: "support",
    label: "Support teams",
    description: "Join organizations, collaborate, and help teams execute.",
  },
]

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type SignUpValues = z.infer<typeof schema>

type SignUpFormProps = {
  redirectTo?: string
  builderRedirectTo?: string
  memberRedirectTo?: string
  loginHref?: string
  signUpMetadata?: Record<string, unknown>
  defaultIntentFocus?: IntentFocus
  lockedIntentFocus?: IntentFocus | null
}

function resolveLegacyAccountIntent(intentFocus: IntentFocus) {
  switch (intentFocus) {
    case "build":
      return "founder_exec"
    case "support":
      return "staff_operator"
    case "fund":
      return "funder_partner"
    case "find":
    default:
      return "board_member"
  }
}

function resolvePostSignUpRedirect({
  intentFocus,
  builderRedirectTo,
  memberRedirectTo,
  redirectTo,
}: {
  intentFocus: IntentFocus
  builderRedirectTo?: string
  memberRedirectTo?: string
  redirectTo?: string
}) {
  if (intentFocus === "build") {
    return builderRedirectTo ?? redirectTo ?? DEFAULT_BUILDER_REDIRECT
  }
  return memberRedirectTo ?? redirectTo ?? DEFAULT_MEMBER_REDIRECT
}

function appendRedirectToHref({
  baseHref,
  redirectTo,
}: {
  baseHref?: string
  redirectTo: string
}) {
  const base = baseHref ?? "/login"
  if (base.includes("redirect=")) return base
  const separator = base.includes("?") ? "&" : "?"
  return `${base}${separator}redirect=${encodeURIComponent(redirectTo)}`
}

function isExistingAccountResponse(user: { identities?: unknown[] } | null | undefined) {
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0)
}

function resolveSignUpErrorMessage(raw: string, isTesterInstantSignup: boolean) {
  const normalized = raw.toLowerCase()
  if (normalized.includes("email rate limit exceeded")) {
    return isTesterInstantSignup
      ? "Tester sign up is temporarily throttled. Retry in a moment."
      : "Too many verification emails were requested. Wait a minute and retry. Internal testers can use /tester/sign-up."
  }
  return raw
}

export function SignUpForm({
  redirectTo,
  builderRedirectTo,
  memberRedirectTo,
  loginHref,
  signUpMetadata,
  defaultIntentFocus = "build",
  lockedIntentFocus = null,
}: SignUpFormProps) {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [intentFocus, setIntentFocus] = useState<IntentFocus>(
    lockedIntentFocus ?? defaultIntentFocus,
  )
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState<string>("")
  const [countdown, setCountdown] = useState(20)
  const [isPending, startTransition] = useTransition()
  const activeIntentFocus = lockedIntentFocus ?? intentFocus
  const resolvedRedirectTo = useMemo(
    () =>
      resolvePostSignUpRedirect({
        intentFocus: activeIntentFocus,
        builderRedirectTo,
        memberRedirectTo,
        redirectTo,
      }),
    [activeIntentFocus, builderRedirectTo, memberRedirectTo, redirectTo],
  )
  const resolvedLoginHref = useMemo(
    () =>
      appendRedirectToHref({
        baseHref: loginHref,
        redirectTo: resolvedRedirectTo,
      }),
    [loginHref, resolvedRedirectTo],
  )
  const isTesterInstantSignup = signUpMetadata?.qa_tester === true

  const form = useForm<SignUpValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  useEffect(() => {
    if (status !== "success") return

    setCountdown(20)
    const intervalId = window.setInterval(() => {
      setCountdown((value) => (value <= 1 ? 0 : value - 1))
    }, 1000)
    const timeoutId = window.setTimeout(() => {
      router.replace(resolvedLoginHref)
      router.refresh()
    }, 20_000)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [resolvedLoginHref, router, status])

  async function onSubmit(values: SignUpValues) {
    setStatus("idle")
    setMessage("")
    setCountdown(20)
    startTransition(async () => {
      if (isTesterInstantSignup) {
        const createResult = await createTesterAccountAction({
          email: values.email,
          password: values.password,
        })

        if (!createResult.ok) {
          setStatus("error")
          setMessage(createResult.error)
          return
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        })
        if (signInError) {
          setStatus("error")
          setMessage(
            "Tester account is ready, but we could not sign you in automatically. Please use sign in."
          )
          return
        }

        router.replace(resolvedRedirectTo)
        router.refresh()
        return
      }

      const emailRedirectTo = resolveAuthCallbackUrl(resolvedRedirectTo)

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo,
          data: {
            ...(signUpMetadata ?? {}),
            account_intent: resolveLegacyAccountIntent(activeIntentFocus),
            onboarding_intent_focus: activeIntentFocus,
          },
        },
      })

      if (error) {
        setStatus("error")
        setMessage(resolveSignUpErrorMessage(error.message, isTesterInstantSignup))
        return
      }

      if (isExistingAccountResponse(data.user)) {
        setStatus("error")
        setMessage("An account with this email already exists. Sign in instead.")
        return
      }

      setStatus("success")
      setMessage(
        "Check your inbox for your verification link from Coach House."
      )
      form.reset()
    })
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {lockedIntentFocus ? null : (
            <div className="space-y-2">
              <FormLabel>How will you use Coach House?</FormLabel>
              <Select
                value={intentFocus}
                onValueChange={(value) => {
                  if (
                    value === "build" ||
                    value === "find" ||
                    value === "fund" ||
                    value === "support"
                  ) {
                    setIntentFocus(value)
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your journey" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {JOURNEY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Builder accounts continue into pricing and workspace onboarding. Member journeys stay on the internal map.
              </p>
            </div>
          )}
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
                  <PasswordInput {...field} autoComplete="new-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {status !== "idle" ? (
            <p
              className={`text-sm ${status === "success" ? "text-emerald-600" : "text-destructive"}`}
              role="status"
            >
              {message}
              {status === "success" ? (
                <>
                  {" "}
                  Redirecting to sign in in {countdown}s.{" "}
                  <Link href={resolvedLoginHref} className="underline underline-offset-2 hover:no-underline">
                    Go now
                  </Link>
                </>
              ) : (
                <>
                  {" "}
                  <Link href={resolvedLoginHref} className="underline underline-offset-2 hover:no-underline">
                    Go to sign in
                  </Link>
                </>
              )}
            </p>
          ) : null}
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </Form>
      <div className="text-center text-sm text-muted-foreground">
        Already have an account? {" "}
        <Link href={loginHref ?? "/login"} className="hover:text-foreground">
          Sign in
        </Link>
      </div>
    </div>
  )
}
