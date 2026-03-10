import PanelLeftCloseIcon from "lucide-react/dist/esm/icons/panel-left-close"
import PanelLeftOpenIcon from "lucide-react/dist/esm/icons/panel-left-open"
import PanelRightCloseIcon from "lucide-react/dist/esm/icons/panel-right-close"
import PanelRightOpenIcon from "lucide-react/dist/esm/icons/panel-right-open"

import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

import { RIGHT_RAIL_ID } from "../constants"
import { useRightRailPresence } from "../right-rail"

type AppShellMobileNavProps = {
  rightOpen: boolean
  onRightOpenChange: (open: boolean) => void
}

export function AppShellMobileNav({ rightOpen, onRightOpenChange }: AppShellMobileNavProps) {
  const hasRightRail = useRightRailPresence()
  const { isMobile, openMobile, toggleSidebar } = useSidebar()

  if (!isMobile) return null

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--shell-border)] bg-[var(--shell-bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--shell-bg)]/80">
      <div
        className={cn(
          "grid items-center gap-6 px-4 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]",
          hasRightRail ? "grid-cols-2" : "grid-cols-1 justify-items-center",
        )}
      >
        <div className="flex flex-col items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="size-11 rounded-full border-[color:var(--shell-border)] bg-transparent"
            aria-label="Toggle sidebar"
            aria-expanded={openMobile}
            onClick={toggleSidebar}
          >
            {openMobile ? (
              <PanelLeftCloseIcon className="h-5 w-5" aria-hidden />
            ) : (
              <PanelLeftOpenIcon className="h-5 w-5" aria-hidden />
            )}
          </Button>
          <span className="text-[11px] font-medium text-muted-foreground">Menu</span>
        </div>
        {hasRightRail ? (
          <div className="flex flex-col items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-11 rounded-full border-[color:var(--shell-border)] bg-transparent"
              aria-label="Toggle details panel"
              aria-controls={RIGHT_RAIL_ID}
              aria-expanded={rightOpen}
              onClick={() => onRightOpenChange(!rightOpen)}
            >
              {rightOpen ? (
                <PanelRightCloseIcon className="h-5 w-5" aria-hidden />
              ) : (
                <PanelRightOpenIcon className="h-5 w-5" aria-hidden />
              )}
            </Button>
            <span className="text-[11px] font-medium text-muted-foreground">Details</span>
          </div>
        ) : null}
      </div>
    </nav>
  )
}
