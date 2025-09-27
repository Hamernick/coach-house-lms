import Link from "next/link"
import type { ReactNode } from "react"

import { requireAdmin } from "@/lib/admin/auth"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/classes", label: "Classes" },
  { href: "/admin/users", label: "People" },
  { href: "/admin/settings", label: "Settings" },
]

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/40 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/dashboard" className="text-base font-semibold">
            Coach House Admin
          </Link>
          <nav className="flex items-center gap-3 text-sm text-muted-foreground">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 font-medium hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
