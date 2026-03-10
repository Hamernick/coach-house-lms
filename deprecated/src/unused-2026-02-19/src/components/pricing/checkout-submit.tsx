"use client"

import { useFormStatus } from "react-dom"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

export function CheckoutSubmit({
  children,
  variant,
}: {
  children: ReactNode
  variant: "default" | "outline"
}) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full" variant={variant} disabled={pending}>
      {pending ? "Redirecting..." : children}
    </Button>
  )
}
