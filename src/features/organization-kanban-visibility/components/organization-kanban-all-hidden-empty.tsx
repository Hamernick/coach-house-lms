"use client"

import { EyeSlash } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"

export function OrganizationKanbanAllHiddenEmpty({
  onReviewHidden,
}: {
  onReviewHidden: () => void
}) {
  return (
    <div className="h-full p-6">
      <Empty
        icon={<EyeSlash className="size-6" aria-hidden />}
        title="Your Kanban is clear"
        description="All organizations are hidden from this personal view. Your access is unchanged."
        variant="subtle"
        actions={
          <Button type="button" variant="outline" onClick={onReviewHidden}>
            Review hidden organizations
          </Button>
        }
      />
    </div>
  )
}
