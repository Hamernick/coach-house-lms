import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle"
import MessageCircle from "lucide-react/dist/esm/icons/message-circle"
import Sparkles from "lucide-react/dist/esm/icons/sparkles"

import { type NotificationItem } from "@/components/notifications/types"
import { cn } from "@/lib/utils"

function toneStyles(tone?: NotificationItem["tone"]) {
  switch (tone) {
    case "warning":
      return "border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400"
    case "success":
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
    default:
      return "border-sky-500/40 bg-sky-500/15 text-sky-600 dark:text-sky-400"
  }
}

export function NotificationToneIcon({ tone }: { tone?: NotificationItem["tone"] }) {
  return (
    <span
      className={cn(
        "mt-1 flex h-8 w-8 items-center justify-center rounded-full border text-xs",
        toneStyles(tone),
      )}
    >
      {tone === "warning" ? <AlertTriangle className="h-4 w-4" /> : null}
      {tone === "info" ? <Sparkles className="h-4 w-4" /> : null}
      {tone === "success" ? <MessageCircle className="h-4 w-4" /> : null}
    </span>
  )
}
