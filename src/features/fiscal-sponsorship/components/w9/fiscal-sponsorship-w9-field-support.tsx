import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

import type { FiscalSponsorshipW9Fields } from "../../lib/w9-field-manifest"

export type W9FieldErrors = Partial<
  Record<keyof FiscalSponsorshipW9Fields, string>
>

export function W9FieldError({ error, id }: { error?: string; id: string }) {
  if (!error) return null
  return (
    <p id={id} className="text-destructive text-xs" role="alert">
      {error}
    </p>
  )
}

export function W9FieldShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn("space-y-2", className)}>{children}</div>
}
