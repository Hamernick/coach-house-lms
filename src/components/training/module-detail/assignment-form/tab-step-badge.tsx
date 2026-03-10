import CheckIcon from "lucide-react/dist/esm/icons/check"

import { cn } from "@/lib/utils"

type TabStepStatus = "not_started" | "in_progress" | "complete"

type TabStepBadgeProps = {
  status: TabStepStatus
  label: number
}

export function TabStepBadge({ status, label }: TabStepBadgeProps) {
  const styles =
    status === "complete"
      ? {
          border: "border-emerald-500",
          text: "text-emerald-500",
          icon: <CheckIcon className="h-3 w-3" />,
          dashed: false,
        }
      : status === "in_progress"
        ? {
            border: "border-amber-500",
            text: "text-amber-500",
            icon: <span className="text-[10px] font-semibold">{label}</span>,
            dashed: true,
          }
        : {
            border: "border-muted-foreground/60",
            text: "text-muted-foreground",
            icon: <span className="text-[10px] font-semibold">{label}</span>,
            dashed: false,
          }

  return (
    <span
      aria-hidden
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 bg-sidebar",
        styles.border,
      )}
      style={{ borderStyle: styles.dashed ? "dashed" : "solid" }}
    >
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-full text-center leading-none",
          styles.text,
        )}
      >
        {styles.icon}
      </span>
    </span>
  )
}

export type { TabStepStatus }
