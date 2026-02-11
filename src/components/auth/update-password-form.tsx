"use client"

import { useEffect, useState, useTransition } from "react"
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
import { PasswordInput } from "@/components/auth/password-input"

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match",
  })

type UpdatePasswordValues = z.infer<typeof schema>

type UpdatePasswordFormProps = {
  redirectTo?: string
}

export function UpdatePasswordForm({ redirectTo = "/my-organization" }: UpdatePasswordFormProps) {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [status, setStatus] = useState<"checking" | "ready" | "no-session">("checking")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<UpdatePasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      if (data.session) {
        setStatus("ready")
      } else {
        setStatus("no-session")
      }
    })
    return () => {
      cancelled = true
    }
  }, [supabase])

  async function onSubmit(values: UpdatePasswordValues) {
    setErrorMessage(null)
    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password: values.password })
      if (error) {
        setErrorMessage(error.message)
        return
      }
      form.reset()
      router.replace(redirectTo)
      router.refresh()
    })
  }

  if (status === "checking") {
    return <p className="text-sm text-muted-foreground">Verifying session...</p>
  }

  if (status === "no-session") {
    return (
      <p className="text-sm text-muted-foreground">
        Reset links are single-use. Request a new reset email to update your password.
      </p>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <PasswordInput {...field} autoComplete="new-password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <PasswordInput {...field} autoComplete="new-password" />
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
          {isPending ? "Updating..." : "Update password"}
        </Button>
      </form>
    </Form>
  )
}
