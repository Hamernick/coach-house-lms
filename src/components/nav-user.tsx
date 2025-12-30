"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import CreditCardIcon from "lucide-react/dist/esm/icons/credit-card"
import MoreVerticalIcon from "lucide-react/dist/esm/icons/more-vertical"
import LogOutIcon from "lucide-react/dist/esm/icons/log-out"
import CircleUserIcon from "lucide-react/dist/esm/icons/circle-user"
import MessageSquareIcon from "lucide-react/dist/esm/icons/message-square"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
const AccountSettingsDialog = dynamic(
  () =>
    import("@/components/account-settings/account-settings-dialog").then((mod) => ({
      default: mod.AccountSettingsDialog,
    })),
  { loading: () => null, ssr: false },
)

type NavUserProps = {
  user: {
    name: string | null
    email: string | null
    avatar?: string | null
  }
  isAdmin?: boolean
}

export function NavUser({ user, isAdmin = false }: NavUserProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  function handleSignOut() {
    setMenuOpen(false)
    startTransition(async () => {
      await fetch("/api/auth/signout", { method: "POST" })
      router.replace("/login")
      router.refresh()
    })
  }

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [menuOpen])

  const displayName = user.name ?? user.email ?? "User"
  const displayEmail = user.email ?? ""
  const avatarFallback = displayName.charAt(0).toUpperCase() || "U"

  return (
    <div className="border-t border-border/60 pt-2">
      <div ref={containerRef} className="relative">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="mt-0 justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                {user.avatar ? <AvatarImage src={user.avatar} alt={displayName} /> : null}
                <AvatarFallback className="rounded-lg">{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium text-foreground">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
              </div>
              <MoreVerticalIcon className="size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {menuOpen ? (
          <div
            role="menu"
            className="absolute bottom-full right-0 z-20 mb-2 w-60 rounded-lg border border-border bg-popover p-2 text-sm shadow-lg"
          >
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
              <Avatar className="h-8 w-8 rounded-lg">
                {user.avatar ? <AvatarImage src={user.avatar} alt={displayName} /> : null}
                <AvatarFallback className="rounded-lg">{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left text-sm leading-tight">
                <span className="truncate font-medium text-foreground">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
              </div>
            </div>
            <div className="my-2 h-px bg-border/60" />
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition hover:bg-muted"
              onClick={() => {
                setMenuOpen(false)
                setSettingsOpen(true)
              }}
            >
              <CircleUserIcon className="size-4" />
              Account settings
            </button>
            <a
              href="mailto:contact@coachhousesolutions.org?subject=Coach%20House%20Feedback"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition hover:bg-muted"
              onClick={() => setMenuOpen(false)}
            >
              <MessageSquareIcon className="size-4" />
              Submit feedback
            </a>
            {!isAdmin ? (
              <Link
                href="/billing"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition hover:bg-muted"
                onClick={() => setMenuOpen(false)}
              >
                <CreditCardIcon className="size-4" />
                Billing
              </Link>
            ) : null}
            <div className="my-2 h-px bg-border/60" />
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-destructive transition hover:bg-destructive/10"
              onClick={() => {
                if (!isPending) {
                  handleSignOut()
                }
              }}
            >
              <LogOutIcon className="size-4" />
              {isPending ? "Signing out..." : "Log out"}
            </button>
          </div>
        ) : null}
      </div>
      <AccountSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        defaultName={displayName}
        defaultEmail={displayEmail}
        defaultMarketingOptIn={true}
        defaultNewsletterOptIn={true}
      />
    </div>
  )
}
