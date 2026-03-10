import Link from "next/link"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"

import { resolveReadinessChecklistVisual } from "@/components/accelerator/accelerator-org-snapshot-strip/helpers"
import { type AcceleratorReadinessChecklistItem } from "@/components/accelerator/accelerator-org-snapshot-strip/types"
import { cn } from "@/lib/utils"

type AcceleratorReadinessChecklistProps = {
  readinessTargetLabel?: string | null
  readinessChecklist: AcceleratorReadinessChecklistItem[]
}

export function AcceleratorReadinessChecklist({ readinessTargetLabel, readinessChecklist }: AcceleratorReadinessChecklistProps) {
  if (!readinessTargetLabel || readinessChecklist.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-border/60 bg-background/25 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Next to reach {readinessTargetLabel}</p>
        <span className="inline-flex h-5 items-center rounded-full border border-border/60 bg-background px-2 text-[10px] font-medium text-muted-foreground">
          {readinessChecklist.length} items
        </span>
      </div>
      <ul className="mt-2 space-y-1.5">
        {readinessChecklist.map((item, index) => {
          const visual = resolveReadinessChecklistVisual(item)
          const ItemIcon = visual.icon

          return (
            <li key={`${item.href}-${item.label}`}>
              <Link
                href={item.href}
                className="group/checklist flex min-w-0 items-center gap-2 rounded-md border border-transparent px-1.5 py-1 text-xs transition-colors hover:border-border/60 hover:bg-accent/30"
              >
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border bg-background/70 text-muted-foreground">
                  <span className={cn("inline-flex h-4 w-4 items-center justify-center rounded-sm border", visual.iconWrapClass)}>
                    <ItemIcon className={cn("h-2.5 w-2.5", visual.iconClass)} aria-hidden />
                  </span>
                </span>
                <span className="min-w-0 flex-1 truncate text-foreground">{item.label}</span>
                <span className="inline-flex items-center text-[10px] font-medium text-muted-foreground">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
                <ChevronRightIcon
                  className="h-3 w-3 shrink-0 text-muted-foreground transition-transform group-hover/checklist:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
