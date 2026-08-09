"use client"

import { Eye } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"

export function OrganizationKanbanVisibilityEmpty({
  onShowKanban,
}: {
  onShowKanban: () => void
}) {
  return (
    <div className="h-full p-6">
      <Empty
        icon={<Eye className="size-6" aria-hidden />}
        title="No hidden organizations"
        description="Organizations you hide from your Kanban will remain accessible here."
        variant="subtle"
        actions={
          <Button type="button" variant="outline" onClick={onShowKanban}>
            Return to My Kanban
          </Button>
        }
      />
    </div>
  )
}
