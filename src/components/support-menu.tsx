"use client"

import { useState } from "react"
import CalendarCheck from "lucide-react/dist/esm/icons/calendar-check"
import Mail from "lucide-react/dist/esm/icons/mail"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

type SupportMenuProps = {
  email?: string
  host?: "joel" | "paula"
  label?: string
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  buttonSize?: React.ComponentProps<typeof Button>["size"]
  buttonClassName?: string
  align?: "start" | "center" | "end"
}

export function SupportMenu({
  email = "contact@coachhousesolutions.org",
  host = "joel",
  label = "Support",
  buttonVariant = "ghost",
  buttonSize = "sm",
  buttonClassName,
  align = "end",
}: SupportMenuProps) {
  const [pending, setPending] = useState(false)

  const handleSchedule = async () => {
    if (pending) return
    setPending(true)
    try {
      const response = await fetch(`/api/meetings/schedule?host=${host}`, { method: "GET" })
      const payload = (await response.json().catch(() => ({}))) as { error?: string; url?: string }
      if (!response.ok) {
        toast.error(payload.error ?? "Unable to schedule a meeting right now.")
        return
      }
      if (!payload.url) {
        toast.error("Scheduling link unavailable.")
        return
      }
      window.open(payload.url, "_blank", "noopener,noreferrer")
      toast.success("Opening your scheduling link.")
    } catch (error) {
      console.error(error)
      toast.error("Unable to schedule a meeting right now.")
    } finally {
      setPending(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild id="support-menu-trigger">
        <Button
          type="button"
          variant={buttonVariant}
          size={buttonSize}
          className={cn(buttonClassName)}
        >
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-52">
        <DropdownMenuItem asChild>
          <a href={`mailto:${email}`} className="flex items-center gap-2">
            <Mail className="h-4 w-4" aria-hidden />
            Email
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void handleSchedule()} disabled={pending}>
          <CalendarCheck className="h-4 w-4" aria-hidden />
          {pending ? "Opening..." : "Book an expert session"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
