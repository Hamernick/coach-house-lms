"use client"

import { CircleNotch, Eye, EyeSlash } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"

export function OrganizationKanbanVisibilityControl({
  hidden,
  onChange,
  organizationName,
  pending,
}: {
  hidden: boolean
  onChange: (hidden: boolean) => void
  organizationName: string
  pending: boolean
}) {
  const label = hidden
    ? `Show ${organizationName} on my Kanban`
    : `Hide ${organizationName} from my Kanban`

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-11 shrink-0 rounded-lg md:size-9"
      disabled={pending}
      aria-busy={pending}
      aria-label={label}
      title={label}
      onClick={() => onChange(!hidden)}
    >
      {pending ? (
        <CircleNotch className="animate-spin" aria-hidden />
      ) : hidden ? (
        <Eye aria-hidden />
      ) : (
        <EyeSlash aria-hidden />
      )}
    </Button>
  )
}
