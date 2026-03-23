import Link from "next/link"
import { createPortal } from "react-dom"
import type { CSSProperties, RefObject } from "react"

import CircleUserIcon from "lucide-react/dist/esm/icons/circle-user"
import CreditCardIcon from "lucide-react/dist/esm/icons/credit-card"
import LogOutIcon from "lucide-react/dist/esm/icons/log-out"
import MessageSquareIcon from "lucide-react/dist/esm/icons/message-square"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

type NavUserMenuContentProps = {
  open: boolean
  menuRef: RefObject<HTMLDivElement | null>
  menuStyle: CSSProperties | null
  user: {
    avatar?: string | null
  }
  displayName: string
  displayEmail: string
  avatarFallback: string
  isAdmin: boolean
  signOutPending: boolean
  onCloseMenu: () => void
  onOpenSettings: () => void
  onSignOut: () => void
}

export function NavUserMenuContent({
  open,
  menuRef,
  menuStyle,
  user,
  displayName,
  displayEmail,
  avatarFallback,
  isAdmin,
  signOutPending,
  onCloseMenu,
  onOpenSettings,
  onSignOut,
}: NavUserMenuContentProps) {
  if (!open || typeof document === "undefined") {
    return null
  }

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={menuStyle ?? undefined}
      className="border-border bg-popover z-50 w-60 rounded-lg border p-2 text-sm shadow-lg"
    >
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
        <Avatar className="h-8 w-8 rounded-lg">
          {user.avatar ? (
            <AvatarImage src={user.avatar} alt={displayName} />
          ) : null}
          <AvatarFallback className="rounded-lg">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col text-left text-sm leading-tight">
          <span className="text-foreground truncate font-medium">
            {displayName}
          </span>
          <span className="text-muted-foreground truncate text-xs">
            {displayEmail}
          </span>
        </div>
      </div>
      <div className="bg-border/60 my-2 h-px" />
      <Button
        type="button"
        variant="ghost"
        className="h-auto w-full justify-start gap-2 rounded-md px-2 py-2 text-left"
        onClick={onOpenSettings}
      >
        <CircleUserIcon className="size-4" />
        Account settings
      </Button>
      <a
        href="mailto:joel@coachhousesolutions.org?subject=Coach%20House%20Feedback"
        className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition"
        onClick={onCloseMenu}
      >
        <MessageSquareIcon className="size-4" />
        Submit feedback
      </a>
      {!isAdmin ? (
        <Link
          href="/billing"
          className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition"
          onClick={onCloseMenu}
        >
          <CreditCardIcon className="size-4" />
          Billing
        </Link>
      ) : null}
      <div className="bg-border/60 my-2 h-px" />
      <Button
        type="button"
        variant="ghost"
        className="text-destructive hover:bg-destructive/10 h-auto w-full justify-start gap-2 rounded-md px-2 py-2 text-left"
        onClick={onSignOut}
      >
        <LogOutIcon className="size-4" />
        {signOutPending ? "Signing out..." : "Log out"}
      </Button>
    </div>,
    document.body,
  )
}
