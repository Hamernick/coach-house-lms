"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useSupabaseClient } from "@/hooks/use-supabase-client"
import { resolveAuthCallbackUrl } from "@/components/auth/auth-callback-url"
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

const AVAILABLE_ACCOUNT_INTENT = "founder_exec" as const

const ACCOUNT_INTENT_OPTIONS = [
  { value: "founder_exec", label: "Founder / Executive lead", available: true },
  { value: "staff_operator", label: "Staff / Program operator", available: false },
  { value: "board_member", label: "Board member", available: false },
  { value: "funder_partner", label: "Funder / Partner / Advisor", available: false },
] as const

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type SignUpValues = z.infer<typeof schema>

type SignUpFormProps = {
  redirectTo?: string
  loginHref?: string
  signUpMetadata?: Record<string, unknown>
}

function isExistingAccountResponse(user: { identities?: unknown[] } | null | undefined) {
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0)
}

export function SignUpForm({ redirectTo = "/organization", loginHref, signUpMetadata }: SignUpFormProps) {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [accountIntent, setAccountIntent] = useState<typeof AVAILABLE_ACCOUNT_INTENT>(AVAILABLE_ACCOUNT_INTENT)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState<string>("")
  const [countdown, setCountdown] = useState(20)
  const [isPending, startTransition] = useTransition()
  const resolvedLoginHref = useMemo(() => loginHref ?? "/login", [loginHref])

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
      const emailRedirectTo = resolveAuthCallbackUrl(redirectTo)

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo,
          data: {
            account_intent: accountIntent,
            ...(signUpMetadata ?? {}),
          },
        },
      })

      if (error) {
        setStatus("error")
        setMessage(error.message)
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
          <div className="space-y-2">
            <FormLabel>Role</FormLabel>
            <Select
              value={accountIntent}
              onValueChange={(value) => {
                if (value === AVAILABLE_ACCOUNT_INTENT) {
                  setAccountIntent(value)
                }
              }}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
              </FormControl>
                <SelectContent>
                  {ACCOUNT_INTENT_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.value !== AVAILABLE_ACCOUNT_INTENT}
                    >
                      {option.label}
                      {!option.available ? (
                        <span className="text-xs text-muted-foreground"> — Coming soon</span>
                      ) : null}
                    </SelectItem>
                  ))}
                </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Additional role options are coming soon.
            </p>
          </div>
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
