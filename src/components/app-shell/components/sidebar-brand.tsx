import Image from "next/image"
import Link from "next/link"

import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type SidebarBrandProps = {
  href: string
}

export function SidebarBrand({ href }: SidebarBrandProps) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Link
      href={href}
      aria-label="Coach House home"
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-2 text-foreground transition-colors hover:bg-sidebar-accent",
        isCollapsed && "justify-center",
      )}
    >
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
        <Image
          src="/coach-house-logo-light.png"
          alt="Coach House logo"
          width={32}
          height={32}
          className="block dark:hidden"
          priority
        />
        <Image
          src="/coach-house-logo-dark.png"
          alt="Coach House logo"
          width={32}
          height={32}
          className="hidden dark:block"
          priority
        />
      </span>
      {isCollapsed ? null : (
        <span className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight">Coach House</span>
          <span className="pt-1 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">
            ALPHA
          </span>
        </span>
      )}
    </Link>
  )
}
