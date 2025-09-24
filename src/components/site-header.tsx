import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { createSupabaseServerClient } from "@/lib/supabase/server"

import { UserMenu } from "./user-menu"
import { ThemeToggle } from "@/components/theme-toggle"

const SUPPORT_EMAIL = "contact@coachhousesolutions.org"

export async function SiteHeader() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  let displayName: string | null = null
  const email: string | null = user?.email ?? null

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle<{ full_name: string | null }>()

    displayName = profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? null
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">Dashboard</h1>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm">
              Support
            </a>
          </Button>
          {user ? (
            <UserMenu name={displayName} email={email} />
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
