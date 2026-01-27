"use client"

import CalendarCheck from "lucide-react/dist/esm/icons/calendar-check"
import Mail from "lucide-react/dist/esm/icons/mail"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCoachingBooking } from "@/hooks/use-coaching-booking"
import { cn } from "@/lib/utils"

type SupportMenuProps = {
  email?: string
  label?: string
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  buttonSize?: React.ComponentProps<typeof Button>["size"]
  buttonClassName?: string
  align?: "start" | "center" | "end"
}

export function SupportMenu({
  email = "contact@coachhousesolutions.org",
  label = "Support",
  buttonVariant = "ghost",
  buttonSize = "sm",
  buttonClassName,
  align = "end",
}: SupportMenuProps) {
  const { schedule, pending } = useCoachingBooking()

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
        <DropdownMenuItem onSelect={() => void schedule()} disabled={pending}>
          <CalendarCheck className="h-4 w-4" aria-hidden />
          {pending ? "Opening..." : "Book a session"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
