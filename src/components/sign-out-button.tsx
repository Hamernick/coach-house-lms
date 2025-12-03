"use client"

import { useTransition, type ComponentProps } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

type SignOutButtonProps = ComponentProps<typeof Button>

export function SignOutButton({ children = "Sign out", ...props }: SignOutButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(async () => {
      await fetch("/api/auth/signout", { method: "POST" })
      router.replace("/login")
      router.refresh()
    })
  }

  return (
    <Button onClick={handleSignOut} disabled={isPending} {...props}>
      {isPending ? "Signing out..." : children}
    </Button>
  )
}
