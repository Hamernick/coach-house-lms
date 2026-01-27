"use client"

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { createPortal } from "react-dom"
import CreditCardIcon from "lucide-react/dist/esm/icons/credit-card"
import MoreVerticalIcon from "lucide-react/dist/esm/icons/more-vertical"
import LogOutIcon from "lucide-react/dist/esm/icons/log-out"
import CircleUserIcon from "lucide-react/dist/esm/icons/circle-user"
import MessageSquareIcon from "lucide-react/dist/esm/icons/message-square"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"
import WrenchIcon from "lucide-react/dist/esm/icons/wrench"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"
import BellIcon from "lucide-react/dist/esm/icons/bell"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { resetAllTutorialsAction } from "@/app/actions/tutorial"
import { resetOnboardingCompletionAction } from "@/app/actions/admin-testing"
import { seedTestNotificationsAction } from "@/app/actions/notifications"
import { toast } from "@/lib/toast"
const AccountSettingsDialog = dynamic(
  () =>
    import("@/components/account-settings/account-settings-dialog").then(
      (mod) => ({
        default: mod.AccountSettingsDialog,
      })
    ),
  { loading: () => null, ssr: false }
)

type NavUserProps = {
  user: {
    name: string | null
    email: string | null
    avatar?: string | null
  }
  isAdmin?: boolean
  showDivider?: boolean
}

export function NavUser({
  user,
  isAdmin = false,
  showDivider = true,
}: NavUserProps) {
  const router = useRouter()
  const [signOutPending, startSignOutTransition] = useTransition()
  const [adminPending, startAdminTransition] = useTransition()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null)

  function dispatchTutorialStart(tutorial?: string) {
    if (typeof window === "undefined") return
    window.dispatchEvent(
      new CustomEvent(
        "coachhouse:tutorial:start",
        tutorial ? { detail: { tutorial } } : undefined
      )
    )
  }

  function dispatchOnboardingStart() {
    if (typeof window === "undefined") return
    window.dispatchEvent(new CustomEvent("coachhouse:onboarding:start"))
  }

  function handleReplayTutorial() {
    setMenuOpen(false)
    dispatchTutorialStart("platform")
  }

  function handleSignOut() {
    setMenuOpen(false)
    startSignOutTransition(async () => {
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
      const target = event.target as Node
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return
      }
      setMenuOpen(false)
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

  useLayoutEffect(() => {
    if (!menuOpen) {
      setMenuStyle(null)
      return
    }

    const updatePosition = () => {
      if (!triggerRef.current || !menuRef.current) return
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const menuRect = menuRef.current.getBoundingClientRect()
      const gap = 8
      const menuWidth = menuRect.width
      const menuHeight = menuRect.height
      const spaceAbove = triggerRect.top
      const spaceBelow = window.innerHeight - triggerRect.bottom
      const openBelow = spaceAbove < menuHeight + gap && spaceBelow >= spaceAbove

      let top = openBelow ? triggerRect.bottom + gap : triggerRect.top - gap
      let left = triggerRect.right
      let transform = openBelow ? "translate(-100%, 0)" : "translate(-100%, -100%)"

      const minLeft = gap + menuWidth
      const maxLeft = window.innerWidth - gap
      if (left < minLeft) {
        left = minLeft
      } else if (left > maxLeft) {
        left = maxLeft
      }

      setMenuStyle({
        position: "fixed",
        top,
        left,
        transform,
        zIndex: 60,
      })
    }

    const frame = requestAnimationFrame(updatePosition)
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [menuOpen])

  const displayName = user.name ?? user.email ?? "User"
  const displayEmail = user.email ?? ""
  const avatarFallback = displayName.charAt(0).toUpperCase() || "U"

  return (
    <div className={showDivider ? "border-border/60 border-t pt-2" : ""}>
      <div ref={containerRef} className="relative">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="mt-0 justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              data-tour="account-menu"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <button ref={triggerRef} type="button" className="flex w-full items-center gap-3">
                <Avatar className="h-8 w-8 rounded-lg grayscale group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                  {user.avatar ? (
                    <AvatarImage src={user.avatar} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="rounded-lg">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="text-foreground truncate font-medium">
                    {displayName}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {displayEmail}
                  </span>
                </div>
                <MoreVerticalIcon className="text-muted-foreground size-4 group-data-[collapsible=icon]:hidden" />
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {menuOpen && typeof document !== "undefined"
          ? createPortal(
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
                <button
                  type="button"
                  className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition"
                  onClick={handleReplayTutorial}
                >
                  <SparklesIcon className="size-4" />
                  Replay tutorial
                </button>
                <button
                  type="button"
                  className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition"
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
                  className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition"
                  onClick={() => setMenuOpen(false)}
                >
                  <MessageSquareIcon className="size-4" />
                  Submit feedback
                </a>
                {!isAdmin ? (
                  <Link
                    href="/billing"
                    className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition"
                    onClick={() => setMenuOpen(false)}
                  >
                    <CreditCardIcon className="size-4" />
                    Billing
                  </Link>
                ) : null}
                {isAdmin ? (
                  <>
                    <div className="bg-border/60 my-2 h-px" />
                    <div className="text-muted-foreground px-2 py-1 text-xs font-medium">
                      Testing
                    </div>
                    <button
                      type="button"
                      className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition"
                      onClick={() => {
                        setMenuOpen(false)
                        dispatchOnboardingStart()
                      }}
                    >
                      <WrenchIcon className="size-4" />
                      Open onboarding
                    </button>
                    <button
                      type="button"
                      className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition"
                      onClick={() => {
                        setMenuOpen(false)
                        dispatchTutorialStart("platform")
                      }}
                    >
                      <SparklesIcon className="size-4" />
                      Start Platform tutorial
                    </button>
                    <button
                      type="button"
                      className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition"
                      onClick={() => {
                        setMenuOpen(false)
                        dispatchTutorialStart("accelerator")
                      }}
                    >
                      <SparklesIcon className="size-4" />
                      Start Accelerator tutorial
                    </button>
                    <Link
                      href="/my-organization?welcome=1"
                      className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition"
                      onClick={() => setMenuOpen(false)}
                    >
                      <SparklesIcon className="size-4" />
                      Show Platform welcome
                    </Link>
                    <Link
                      href="/accelerator?welcome=1"
                      className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition"
                      onClick={() => setMenuOpen(false)}
                    >
                      <SparklesIcon className="size-4" />
                      Show Accelerator welcome
                    </Link>
                    <button
                      type="button"
                      disabled={adminPending}
                      className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition disabled:opacity-60"
                      onClick={() => {
                        if (adminPending) return
                        setMenuOpen(false)
                        startAdminTransition(async () => {
                          await resetAllTutorialsAction()
                          if (typeof window !== "undefined") {
                            const tutorials = [
                              "platform",
                              "dashboard",
                              "my-organization",
                              "roadmap",
                              "documents",
                              "billing",
                              "accelerator",
                              "people",
                              "marketplace",
                            ]
                            for (const tutorial of tutorials) {
                              window.localStorage.removeItem(
                                `coachhouse_tutorial_completed_${tutorial}`
                              )
                              window.localStorage.removeItem(
                                `coachhouse_tutorial_dismissed_${tutorial}`
                              )
                            }
                            window.localStorage.removeItem(
                              "coachhouse_tour_completed"
                            )
                          }
                          router.refresh()
                        })
                      }}
                    >
                      <RotateCcwIcon className="size-4" />
                      Reset tutorials
                    </button>
                    <button
                      type="button"
                      disabled={adminPending}
                      className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition disabled:opacity-60"
                      onClick={() => {
                        if (adminPending) return
                        setMenuOpen(false)
                        startAdminTransition(async () => {
                          await resetOnboardingCompletionAction()
                          if (typeof window !== "undefined") {
                            window.localStorage.removeItem("onboardingDraftV2")
                          }
                          dispatchOnboardingStart()
                          router.refresh()
                        })
                      }}
                    >
                      <RotateCcwIcon className="size-4" />
                      Reset onboarding
                    </button>
                    <button
                      type="button"
                      disabled={adminPending}
                      className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition disabled:opacity-60"
                      onClick={() => {
                        if (adminPending) return
                        setMenuOpen(false)
                        startAdminTransition(async () => {
                          const result = await seedTestNotificationsAction()
                          if ("error" in result) {
                            toast.error(result.error)
                            return
                          }
                          toast.success("Test notifications created.")
                          router.refresh()
                        })
                      }}
                    >
                      <BellIcon className="size-4" />
                      Seed notifications
                    </button>
                  </>
                ) : null}
                <div className="bg-border/60 my-2 h-px" />
                <button
                  type="button"
                  className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition"
                  onClick={() => {
                    if (!signOutPending) {
                      handleSignOut()
                    }
                  }}
                >
                  <LogOutIcon className="size-4" />
                  {signOutPending ? "Signing out..." : "Log out"}
                </button>
              </div>,
              document.body
            )
          : null}
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
