"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const ItemGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex w-full flex-col", className)} {...props} />
  ),
)
ItemGroup.displayName = "ItemGroup"

const ItemSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mx-12 border-t border-border/60", className)} {...props} />
  ),
)
ItemSeparator.displayName = "ItemSeparator"

export { ItemGroup, ItemSeparator }
