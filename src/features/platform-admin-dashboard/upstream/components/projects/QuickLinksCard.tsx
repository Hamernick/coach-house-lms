"use client"

import { DotsThree, Paperclip, Plus } from "@phosphor-icons/react/dist/ssr"

import type { QuickLink } from "@/features/platform-admin-dashboard/upstream/lib/data/project-details"
import { Button } from "@/features/platform-admin-dashboard/upstream/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/features/platform-admin-dashboard/upstream/components/ui/dropdown-menu"
import { Separator } from "@/features/platform-admin-dashboard/upstream/components/ui/separator"
import { FileLinkRow } from "@/features/platform-admin-dashboard/upstream/components/projects/FileLinkRow"

type QuickLinksCardProps = {
  links: QuickLink[]
  onAddLink?: () => void
  onEditLink?: (linkId: string) => void
  onDeleteLink?: (linkId: string) => void
  addLabel?: string
  emptyTitle?: string
  emptyDescription?: string
}

export function QuickLinksCard({
  links,
  onAddLink,
  onEditLink,
  onDeleteLink,
  addLabel = "Add link",
  emptyTitle = "No links",
  emptyDescription = "Add important URLs for this project.",
}: QuickLinksCardProps) {
  const isEmpty = links.length === 0
  const canManageLinks = Boolean(onAddLink || onEditLink || onDeleteLink)

  return (
    <div>
      <div className="flex items-center justify-between gap-3 pb-6">
        <h3 className="text-base font-semibold">Quick links</h3>
        {onAddLink ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg"
            onClick={onAddLink}
          >
            <Plus className="h-4 w-4" />
            {addLabel}
          </Button>
        ) : null}
      </div>
      <div>
        {isEmpty ? (
          <div className="rounded-lg border border-dashed border-border/70 p-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">{emptyTitle}</div>
                <div className="mt-1 text-muted-foreground">{emptyDescription}</div>
                {onAddLink ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={onAddLink}
                  >
                    <Plus className="h-4 w-4" />
                    {addLabel}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((f, idx) => (
              <div key={f.id}>
                <FileLinkRow
                  file={f}
                  actions={
                    canManageLinks ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground"
                            aria-label={`Open actions for ${f.name}`}
                          >
                            <DotsThree className="h-4 w-4" weight="bold" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onEditLink ? (
                            <DropdownMenuItem onClick={() => onEditLink(f.id)}>
                              Edit
                            </DropdownMenuItem>
                          ) : null}
                          {onDeleteLink ? (
                            <DropdownMenuItem onClick={() => onDeleteLink(f.id)}>
                              Delete
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null
                  }
                />
                {idx < links.length - 1 ? <Separator className="mt-3" /> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
