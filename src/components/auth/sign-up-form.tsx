"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useSupabaseClient } from "@/hooks/use-supabase-client"
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

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type SignUpValues = z.infer<typeof schema>

type SignUpFormProps = {
  redirectTo?: string
}

export function SignUpForm({ redirectTo = "/my-organization" }: SignUpFormProps) {
  const supabase = useSupabaseClient()
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  const form = useForm<SignUpValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: SignUpValues) {
    setStatus("idle")
    setMessage("")
    startTransition(async () => {
      const origin = typeof window === "undefined" ? undefined : window.location.origin
      const emailRedirectTo = origin
        ? `${origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
        : undefined

      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo,
        },
      })

      if (error) {
        setStatus("error")
        setMessage(error.message)
        return
      }

      setStatus("success")
      setMessage(
        "Check your inbox for a verification link. After confirming, you'll be redirected automatically."
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
                  <Input {...field} type="password" autoComplete="new-password" />
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
            </p>
          ) : null}
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </Form>
      <div className="text-center text-sm text-muted-foreground">
        Already have an account? {" "}
        <Link href="/login" className="hover:text-foreground">
          Sign in
        </Link>
      </div>
    </div>
  )
}
