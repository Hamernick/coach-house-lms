"use client"

import Link from "next/link"
import DownloadIcon from "lucide-react/dist/esm/icons/download"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function WorkspaceBrandKitDownloadButton({
  href,
  label = "Download kit",
  variant = "outline",
  size = "sm",
  disabled = false,
  className,
}: {
  href: string
  label?: string
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "sm" | "default" | "lg" | "icon"
  disabled?: boolean
  className?: string
}) {
  if (disabled) {
    return (
      <Button type="button" variant={variant} size={size} className={className} disabled>
        <DownloadIcon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </Button>
    )
  }

  return (
    <Button type="button" variant={variant} size={size} className={cn(className)} asChild>
      <Link href={href} prefetch={false} target="_blank">
        <DownloadIcon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </Link>
    </Button>
  )
}
