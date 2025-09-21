"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { CircleUser, LogOut } from "lucide-react"

import { useSupabaseClient } from "@/hooks/use-supabase-client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type UserMenuProps = {
  name?: string | null
  email?: string | null
}

export function UserMenu({ name, email }: UserMenuProps) {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function signOut() {
    startTransition(async () => {
      await supabase.auth.signOut()
      router.replace("/login")
      router.refresh()
    })
  }

  const displayName = name && name.trim().length > 0 ? name : email ?? "Account"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <CircleUser className="h-4 w-4" aria-hidden />
          <span className="max-w-[140px] truncate text-sm font-medium">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div>
            <p className="text-sm font-medium leading-tight">{displayName}</p>
            {email ? (
              <p className="text-xs text-muted-foreground leading-tight">{email}</p>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/settings" className="w-full cursor-pointer">
            Settings
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 text-destructive focus:text-destructive"
          onSelect={(event) => {
            event.preventDefault()
            if (!isPending) {
              signOut()
            }
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {isPending ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
