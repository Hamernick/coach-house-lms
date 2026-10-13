"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function InputGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex w-full items-stretch gap-2", className)} {...props} />
}

export function InputGroupAddon({ className, align = "inline", ...props }: React.HTMLAttributes<HTMLDivElement> & { align?: "inline" | "block-end" }) {
  const alignClass = align === "block-end" ? "self-end" : "self-auto"
  return <div className={cn("flex items-center gap-2", alignClass, className)} {...props} />
}

export function InputGroupButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("inline-flex h-9 items-center rounded-md px-3 text-sm border bg-secondary hover:bg-secondary/80", className)} {...props} />
}

export function InputGroupText({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex h-9 items-center rounded-md border px-2 text-xs text-muted-foreground bg-muted/60",
        className,
      )}
      {...props}
    />
  )
}

export function InputGroupInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("flex-1 h-9 rounded-md border bg-background px-3 text-sm", className)} {...props} />
}

export function InputGroupTextarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("w-full rounded-md border bg-background p-3 text-sm", className)} {...props} />
}
