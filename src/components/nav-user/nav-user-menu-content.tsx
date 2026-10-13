import Link from "next/link"
import { createPortal } from "react-dom"
import type { CSSProperties, RefObject } from "react"

import CircleUserIcon from "lucide-react/dist/esm/icons/circle-user"
import CreditCardIcon from "lucide-react/dist/esm/icons/credit-card"
import LogOutIcon from "lucide-react/dist/esm/icons/log-out"
import MessageSquareIcon from "lucide-react/dist/esm/icons/message-square"

import { NavUserTestingSection } from "@/components/nav-user-testing-section"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { resolveDevtoolsAccess } from "@/lib/devtools/access"

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
  devtools: ReturnType<typeof resolveDevtoolsAccess>
  adminPending: boolean
  signOutPending: boolean
  onCloseMenu: () => void
  onOpenSettings: () => void
  onOpenOnboarding: () => void
  onStartTutorial: (tutorial: "platform" | "accelerator") => void
  onResetTutorials: () => void
  onResetOnboarding: () => void
  onSeedNotifications: () => void
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
  devtools,
  adminPending,
  signOutPending,
  onCloseMenu,
  onOpenSettings,
  onOpenOnboarding,
  onStartTutorial,
  onResetTutorials,
  onResetOnboarding,
  onSeedNotifications,
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
      <NavUserTestingSection
        devtools={devtools}
        adminPending={adminPending}
        onCloseMenu={onCloseMenu}
        onOpenOnboarding={onOpenOnboarding}
        onStartTutorial={onStartTutorial}
        onResetTutorials={onResetTutorials}
        onResetOnboarding={onResetOnboarding}
        onSeedNotifications={onSeedNotifications}
      />
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
