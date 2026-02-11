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

const ACCOUNT_INTENT_OPTIONS = [
  { value: "founder_exec", label: "Founder / Executive lead" },
  { value: "staff_operator", label: "Staff / Program operator" },
  { value: "board_member", label: "Board member" },
  { value: "funder_partner", label: "Funder / Partner / Advisor" },
] as const

const schema = z.object({
  accountIntent: z.string().min(1, "Select your role"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type SignUpValues = z.infer<typeof schema>

type SignUpFormProps = {
  redirectTo?: string
  loginHref?: string
}

export function SignUpForm({ redirectTo = "/my-organization", loginHref }: SignUpFormProps) {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState<string>("")
  const [countdown, setCountdown] = useState(20)
  const [isPending, startTransition] = useTransition()
  const resolvedLoginHref = useMemo(() => loginHref ?? "/login", [loginHref])

  const form = useForm<SignUpValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountIntent: "",
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

      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo,
          data: {
            account_intent: values.accountIntent,
          },
        },
      })

      if (error) {
        setStatus("error")
        setMessage(error.message)
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
          <FormField
            control={form.control}
            name="accountIntent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ACCOUNT_INTENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
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
              ) : null}
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
