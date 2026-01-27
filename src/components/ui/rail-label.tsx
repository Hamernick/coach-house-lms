"use client"

import * as React from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function RailLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return (
    <Label
      {...props}
      className={cn("text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)}
    />
  )
}
