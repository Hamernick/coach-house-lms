"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import MoreVerticalIcon from "lucide-react/dist/esm/icons/more-vertical"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { resetOnboardingCompletionAction } from "@/app/actions/admin-testing"
import { seedTestNotificationsAction } from "@/app/actions/notifications"
import { resetAllTutorialsAction } from "@/app/actions/tutorial"
import { resolveDevtoolsAccess } from "@/lib/devtools/access"
import { toast } from "@/lib/toast"

import { useNavUserMenu } from "./nav-user/hooks/use-nav-user-menu"
import { NavUserMenuContent } from "./nav-user/nav-user-menu-content"

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
    title?: string | null
    email: string | null
    avatar?: string | null
  }
  isAdmin?: boolean
  isTester?: boolean
  showDivider?: boolean
}

export function NavUser({
  user,
  isAdmin = false,
  isTester = false,
  showDivider = true,
}: NavUserProps) {
  const router = useRouter()
  const [signOutPending, startSignOutTransition] = useTransition()
  const [adminPending, startAdminTransition] = useTransition()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const {
    menuOpen,
    setMenuOpen,
    containerRef,
    triggerRef,
    menuRef,
    menuStyle,
  } = useNavUserMenu()

  function dispatchTutorialStart(tutorial?: "platform" | "accelerator") {
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

  function handleSignOut() {
    setMenuOpen(false)
    startSignOutTransition(async () => {
      await fetch("/api/auth/signout", { method: "POST" })
      router.replace("/")
      router.refresh()
    })
  }

  const normalizedName = typeof user.name === "string" ? user.name.trim() : ""
  const normalizedTitle = typeof user.title === "string" ? user.title.trim() : ""
  const normalizedEmail = typeof user.email === "string" ? user.email.trim() : ""
  const displayName = normalizedName || normalizedEmail || "User"
  const displayEmail = normalizedEmail
  const displaySubtitle =
    normalizedTitle ||
    (normalizedEmail && normalizedEmail.toLowerCase() !== displayName.toLowerCase() ? normalizedEmail : "")
  const displayAvatar = user.avatar ?? null
  const avatarFallback = displayName.charAt(0).toUpperCase() || "U"
  const devtools = resolveDevtoolsAccess({ isAdmin, isTester })

  return (
    <div className={showDivider ? "border-border/60 border-t pt-2" : ""}>
      <div ref={containerRef} className="relative">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="mt-[10px] justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              data-tour="account-menu"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <Button
                ref={triggerRef}
                type="button"
                variant="ghost"
                className="h-auto w-full justify-start gap-3 rounded-lg px-2 py-2 text-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                  {displayAvatar ? (
                    <AvatarImage src={displayAvatar} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="rounded-lg">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="text-foreground truncate font-medium">
                    {displayName}
                  </span>
                  {displaySubtitle ? (
                    <span className="text-muted-foreground truncate text-xs">
                      {displaySubtitle}
                    </span>
                  ) : null}
                </div>
                <MoreVerticalIcon className="text-muted-foreground size-4 group-data-[collapsible=icon]:hidden" />
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <NavUserMenuContent
          open={menuOpen}
          menuRef={menuRef}
          menuStyle={menuStyle}
          user={user}
          displayName={displayName}
          displayEmail={displayEmail}
          avatarFallback={avatarFallback}
          isAdmin={isAdmin}
          devtools={devtools}
          adminPending={adminPending}
          signOutPending={signOutPending}
          onCloseMenu={() => setMenuOpen(false)}
          onOpenSettings={() => {
            setMenuOpen(false)
            setSettingsOpen(true)
          }}
          onOpenOnboarding={dispatchOnboardingStart}
          onStartTutorial={dispatchTutorialStart}
          onResetTutorials={() => {
            if (adminPending) return
            setMenuOpen(false)
            startAdminTransition(async () => {
              const result = await resetAllTutorialsAction()
              if ("error" in result) {
                toast.error(result.error)
                return
              }

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
                  window.localStorage.removeItem(`coachhouse_tutorial_completed_${tutorial}`)
                  window.localStorage.removeItem(`coachhouse_tutorial_dismissed_${tutorial}`)
                }
                window.localStorage.removeItem("coachhouse_tour_completed")
              }
              router.refresh()
            })
          }}
          onResetOnboarding={() => {
            if (adminPending) return
            setMenuOpen(false)
            startAdminTransition(async () => {
              const result = await resetOnboardingCompletionAction()
              if ("error" in result) {
                toast.error(result.error)
                return
              }

              if (typeof window !== "undefined") {
                window.localStorage.removeItem("onboardingDraftV2")
              }
              dispatchOnboardingStart()
              router.refresh()
            })
          }}
          onSeedNotifications={() => {
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
          onSignOut={() => {
            if (!signOutPending) {
              handleSignOut()
            }
          }}
        />
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
