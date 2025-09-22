import type { CSSProperties, ReactNode } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { createSupabaseServerClient } from "@/lib/supabase"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  let displayName: string | null = null
  let email: string | null = session?.user.email ?? null
  let avatar: string | null = null

  if (session) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .maybeSingle<{ full_name: string | null }>()

    displayName = profile?.full_name ?? (session.user.user_metadata?.full_name as string | undefined) ?? null

    if (!email && typeof session.user.user_metadata?.email === "string") {
      email = session.user.user_metadata.email as string
    }

    if (typeof session.user.user_metadata?.avatar_url === "string") {
      avatar = session.user.user_metadata.avatar_url as string
    }
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        user={{
          name: displayName,
          email,
          avatar,
        }}
      />
      <SidebarInset>
        <SiteHeader />
        <main className="flex flex-1 flex-col" role="main">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">{children}</div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
