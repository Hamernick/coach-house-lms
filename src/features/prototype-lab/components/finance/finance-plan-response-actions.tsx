import CheckIcon from "lucide-react/dist/esm/icons/check"
import HandshakeIcon from "lucide-react/dist/esm/icons/handshake"
import PencilIcon from "lucide-react/dist/esm/icons/pencil"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Button } from "@/components/ui/button"
import type { FinancePlanResponseAction } from "@/lib/prototype-lab/finance-plan-response"
import { cn } from "@/lib/utils"

const ACTIONS = [
  { action: "confirm", Icon: CheckIcon, label: "Confirm", saved: "Confirmed" },
  { action: "deny", Icon: XIcon, label: "Deny", saved: "Denied" },
  { action: "agree", Icon: HandshakeIcon, label: "Agree", saved: "Agreed" },
] as const

export function FinancePlanResponseActions({
  disabled,
  inProgress,
  onAction,
  onAddNote,
  resolvedAction,
}: {
  disabled: boolean
  inProgress: boolean
  onAction: (action: FinancePlanResponseAction) => void
  onAddNote: () => void
  resolvedAction: FinancePlanResponseAction | null
}) {
  return (
    <div className="nowheel flex shrink-0 gap-1 overflow-x-auto">
      {ACTIONS.map(({ action, Icon, label, saved }) => {
        const selected = resolvedAction === action
        return (
          <Button
            aria-pressed={selected}
            className={cn(
              "h-10 shrink-0 rounded-full px-3 text-xs",
              selected &&
                "bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white"
            )}
            disabled={disabled}
            key={action}
            onClick={() => onAction(action)}
            size="sm"
            type="button"
            variant={selected ? "default" : "ghost"}
          >
            <Icon aria-hidden="true" className="size-3.5" />
            {selected ? saved : label}
          </Button>
        )
      })}
      <Button
        aria-pressed={inProgress}
        className={cn(
          "h-10 shrink-0 rounded-full px-3 text-xs",
          inProgress &&
            "bg-amber-500 text-zinc-950 hover:bg-amber-600 hover:text-zinc-950"
        )}
        disabled={disabled}
        onClick={onAddNote}
        size="sm"
        type="button"
        variant={inProgress ? "default" : "ghost"}
      >
        <PencilIcon aria-hidden="true" className="size-3.5" />
        {inProgress ? "In progress" : "Add note"}
      </Button>
    </div>
  )
}
