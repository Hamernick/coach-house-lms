"use client"

import XIcon from "lucide-react/dist/esm/icons/x"
import { usePathname } from "next/navigation"

import type { AppSidebarProps } from "@/components/app-sidebar"
import { SidebarBody } from "@/components/app-sidebar"

type MobileSidebarProps = AppSidebarProps & {
  openMap: Record<string, boolean>
  setOpenMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebar({
  user,
  isAdmin,
  classes,
  acceleratorProgress,
  showLiveBadges,
  openMap,
  setOpenMap,
  open,
  onOpenChange,
}: MobileSidebarProps) {
  const pathname = usePathname()
  const isAcceleratorActive = (pathname ?? "").startsWith("/accelerator")
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} aria-hidden />
      <div className="relative ml-auto flex h-full w-[85%] max-w-80 flex-col gap-4 border-l border-border bg-card px-3 py-6 shadow-xl">
        <button
          type="button"
          className="self-end rounded-md border border-border/70 bg-background p-1 text-muted-foreground transition hover:text-foreground"
          onClick={() => onOpenChange(false)}
          aria-label="Close navigation"
        >
          <XIcon className="size-4" />
        </button>
        <SidebarBody
          isAdmin={Boolean(isAdmin)}
          classes={classes}
          acceleratorProgress={acceleratorProgress}
          isAcceleratorActive={isAcceleratorActive}
          showLiveBadges={showLiveBadges}
          openMap={openMap}
          setOpenMap={(next) => {
            setOpenMap(next)
            onOpenChange(false)
          }}
          user={{
            name: user?.name ?? null,
            email: user?.email ?? null,
            avatar: user?.avatar ?? null,
          }}
        />
      </div>
    </div>
  )
}
