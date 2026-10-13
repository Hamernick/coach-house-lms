import type { ReactNode } from "react"
import XIcon from "lucide-react/dist/esm/icons/x"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { SidebarHeader, useSidebar } from "@/components/ui/sidebar"
import { SidebarBrand } from "./sidebar-brand"

export function AppShellSidebarHeader({
  children,
  brandHref,
}: {
  children?: ReactNode
  brandHref: string
}) {
  const { setOpenMobile } = useSidebar()
  return (
    <SidebarHeader>
      <div className="flex min-w-0 items-center justify-between gap-2">
        {children ?? <SidebarBrand href={brandHref} />}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 md:hidden"
          aria-label="Close menu"
          onClick={() => setOpenMobile(false)}
        >
          <XIcon aria-hidden />
        </Button>
      </div>
      <div className="flex items-center justify-between px-2 pt-2 md:hidden [&>button]:size-11">
        <span className="text-muted-foreground text-xs">Appearance</span>
        <ThemeToggle />
      </div>
    </SidebarHeader>
  )
}
