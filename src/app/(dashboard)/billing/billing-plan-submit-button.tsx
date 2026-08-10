"use client"

import { useFormStatus } from "react-dom"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"

export function BillingPlanSubmitButton({
  children,
  className,
  variant,
}: {
  children: ReactNode
  className?: string
  variant: "default" | "secondary"
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className={className}
      variant={variant}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? (
        <Loader2Icon className="size-4 animate-spin" aria-hidden />
      ) : null}
      <span>{children}</span>
    </Button>
  )
}
