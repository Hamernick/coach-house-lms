import { cn } from "@/lib/utils"
import type { ReactNode } from "react";
import { Separator } from "@/features/platform-admin-dashboard/upstream/components/ui/separator"

export type MetaChip = {
  label: string
  value: string | ReactNode
  icon?: ReactNode
}

type MetaChipsRowProps = {
  items: MetaChip[]
  className?: string
}

export function MetaChipsRow({ items, className }: MetaChipsRowProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-xs", className)}>
      {items.map((item, idx) => (
        <div key={`${item.label}-${idx}`} className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            {item.icon ? <span className="text-muted-foreground">{item.icon}</span> : null}
            {item.label && <span className="text-muted-foreground">{item.label}:</span>}
            <span className="text-foreground font-medium">{typeof item.value === 'string' ? item.value : item.value}</span>
          </div>
          {idx < items.length - 1 ? <Separator orientation="vertical" className="h-4" /> : null}
        </div>
      ))}
    </div>
  )
}
