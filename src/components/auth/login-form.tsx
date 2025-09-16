"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormValues = z.infer<typeof schema>

type LoginFormProps = {
  redirectTo?: string
  initialError?: string | null
}

export function LoginForm({ redirectTo, initialError }: LoginFormProps) {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError ?? null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: LoginFormValues) {
    setErrorMessage(null)
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        setErrorMessage(error.message)
        return
      }

      form.reset()
      router.replace(redirectTo ?? "/dashboard")
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
                  <Input {...field} type="password" autoComplete="current-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {errorMessage ? (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Form>
      <div className="flex justify-between text-sm text-muted-foreground">
        <Link href="/sign-up" className="hover:text-foreground">
          Need an account? Sign up
        </Link>
        <Link href="/forgot-password" className="hover:text-foreground">
          Forgot password?
        </Link>
      </div>
    </div>
  )
}
