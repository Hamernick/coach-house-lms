import { cn } from "@/lib/utils"

export function SectionRailIndicator({
  top,
  height,
  visible,
  className,
}: {
  top: number
  height: number
  visible: boolean
  className?: string
}) {
  return (
    <span
      aria-hidden
      data-slot="section-rail-indicator"
      className={cn(
        "bg-foreground/90 pointer-events-none absolute w-[2px] rounded-full transition-[transform,height,opacity] duration-200 ease-out motion-reduce:transition-none",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
      style={{ height, transform: `translateY(${top}px)` }}
    />
  )
}
