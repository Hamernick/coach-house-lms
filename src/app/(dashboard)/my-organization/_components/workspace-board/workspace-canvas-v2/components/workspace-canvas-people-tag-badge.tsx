import type { CSSProperties } from "react"

import { Badge } from "@/components/ui/badge"
import {
  getOrganizationPeopleTagColorHex,
  type OrganizationPeopleTag,
} from "@/lib/people/tags"
import { cn } from "@/lib/utils"

export function WorkspacePeopleTagBadge({
  className,
  tag,
}: {
  className?: string
  tag: Pick<OrganizationPeopleTag, "color" | "label">
}) {
  return (
    <Badge
      className={cn(
        "max-w-40 rounded-full border-transparent text-white shadow-none",
        className
      )}
      style={
        {
          "--workspace-people-tag-color": getOrganizationPeopleTagColorHex(
            tag.color
          ),
          backgroundColor: "var(--workspace-people-tag-color)",
        } as CSSProperties
      }
    >
      <span className="truncate">{tag.label}</span>
    </Badge>
  )
}
