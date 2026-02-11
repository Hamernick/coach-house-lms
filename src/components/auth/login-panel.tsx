"use client"

import { LoginForm } from "@/components/auth/login-form"
import { cn } from "@/lib/utils"

type LoginPanelProps = {
  redirectTo?: string
  initialError?: string | null
  signUpHref?: string
  className?: string
}

export function LoginPanel({ redirectTo, initialError, signUpHref, className }: LoginPanelProps) {
  return (
    <div className={cn("w-full max-w-sm space-y-6", className)}>
      <div className="space-y-2 text-left">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Access your courses and continue where you left off.
        </p>
      </div>
      <LoginForm redirectTo={redirectTo} initialError={initialError} signUpHref={signUpHref} />
    </div>
  )
}
