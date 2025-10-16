"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { IconCreditCard, IconDotsVertical, IconLogout, IconUserCircle } from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useSupabaseClient } from "@/hooks/use-supabase-client"
import { AccountSettingsDialog } from "@/components/account-settings/account-settings-dialog"

type NavUserProps = {
  user: {
    name: string | null
    email: string | null
    avatar?: string | null
  }
  isAdmin?: boolean
}

export function NavUser({ user, isAdmin = false }: NavUserProps) {
  const { isMobile } = useSidebar()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [settingsOpen, setSettingsOpen] = useState(false)

  function handleSignOut() {
    startTransition(async () => {
      await supabase.auth.signOut()
      router.replace("/login")
      router.refresh()
    })
  }

  const displayName = user.name ?? user.email ?? "User"
  const displayEmail = user.email ?? ""
  const avatarFallback = displayName.charAt(0).toUpperCase() || "U"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                {user.avatar ? <AvatarImage src={user.avatar} alt={displayName} /> : null}
                <AvatarFallback className="rounded-lg">{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="text-muted-foreground truncate text-xs">{displayEmail}</span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {user.avatar ? <AvatarImage src={user.avatar} alt={displayName} /> : null}
                  <AvatarFallback className="rounded-lg">{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="text-muted-foreground truncate text-xs">{displayEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="flex items-center gap-2"
                onSelect={(e) => {
                  e.preventDefault()
                  setSettingsOpen(true)
                }}
              >
                <IconUserCircle />
                Account settings
              </DropdownMenuItem>
              {!isAdmin ? (
                <DropdownMenuItem asChild>
                  <a className="flex w-full items-center gap-2" href="/billing">
                    <IconCreditCard />
                    Billing
                  </a>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(event) => {
                event.preventDefault()
                if (!isPending) {
                  handleSignOut()
                }
              }}
            >
              <IconLogout />
              {isPending ? "Signing out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <AccountSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          defaultName={displayName}
          defaultEmail={displayEmail}
          defaultMarketingOptIn={true}
          defaultNewsletterOptIn={true}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
