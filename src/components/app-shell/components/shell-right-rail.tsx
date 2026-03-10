import { useEffect } from "react"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

import { RIGHT_RAIL_ID } from "../constants"
import { useRightRailContent } from "../right-rail"

type ShellRightRailProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAutoClose?: (open: boolean) => void
}

export function ShellRightRail({
  open,
  onOpenChange,
  onAutoClose,
}: ShellRightRailProps) {
  const isMobile = useIsMobile()
  const content = useRightRailContent()
  const hasContent = Boolean(content)

  useEffect(() => {
    if (!hasContent && open) {
      if (onAutoClose) {
        onAutoClose(false)
      } else {
        onOpenChange(false)
      }
    }
  }, [hasContent, onAutoClose, onOpenChange, open])

  if (!hasContent) return null

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[var(--shell-right-rail-width)] border-0 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Details</SheetTitle>
          </SheetHeader>
          <div className="h-full overflow-y-auto px-4 py-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside
      id={RIGHT_RAIL_ID}
      data-state={open ? "open" : "closed"}
      className={cn(
        "relative z-30 hidden h-full shrink-0 flex-col overflow-hidden bg-[var(--shell-bg)] md:flex",
        "transition-[width] duration-200 ease-out motion-reduce:transition-none",
        open ? "w-[var(--shell-right-rail-width)]" : "w-0 pointer-events-none",
      )}
    >
      <div
        data-state={open ? "open" : "closed"}
        className={cn(
          "h-full w-full overflow-y-auto px-[var(--shell-rail-padding)] pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4",
          "transition-opacity duration-150 ease-out motion-reduce:transition-none",
          "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
        )}
      >
        {content}
      </div>
    </aside>
  )
}
