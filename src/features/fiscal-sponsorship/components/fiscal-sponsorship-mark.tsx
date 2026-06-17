import { cn } from "@/lib/utils"

export function FiscalSponsorshipMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-primary/10 text-primary inline-flex size-10 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold tracking-tight italic",
        className
      )}
    >
      FS
    </span>
  )
}
