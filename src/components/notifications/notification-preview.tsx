"use client"

import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"

import { NotificationToneIcon } from "@/components/notifications/notification-tone-icon"
import { type NotificationItem } from "@/components/notifications/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

type NotificationPreviewProps = {
  item: NotificationItem | null
  loading: boolean
  updating: boolean
  requestUpdating: "accepted" | "declined" | null
  onOpen: (item: NotificationItem) => void
  onToggleRead: (item: NotificationItem) => void
  onRespondToOrganizationAccessRequest: (
    item: NotificationItem,
    nextStatus: "accepted" | "declined",
  ) => void
}

export function NotificationPreview({
  item,
  loading,
  updating,
  requestUpdating,
  onOpen,
  onToggleRead,
  onRespondToOrganizationAccessRequest,
}: NotificationPreviewProps) {
  if (loading && !item) {
    return (
      <div className="flex min-h-[10rem] items-center justify-center border-t border-border/60 px-4 py-6 text-xs text-muted-foreground md:min-h-0 md:flex-1 md:border-t-0 md:border-l">
        Loading…
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex min-h-[10rem] items-center justify-center border-t border-border/60 px-4 py-6 text-xs text-muted-foreground md:min-h-0 md:flex-1 md:border-t-0 md:border-l">
        No notifications in this view.
      </div>
    )
  }

  return (
    <div className="flex min-h-[10rem] max-h-[min(38dvh,20rem)] flex-col border-t border-border/60 md:min-h-0 md:max-h-none md:flex-1 md:border-t-0 md:border-l">
      <div className="border-b border-border/60 px-4 py-4">
        <div className="flex items-start gap-3">
          <NotificationToneIcon tone={item.tone} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <Badge
                variant={item.unread ? "default" : "outline"}
                className="rounded-full px-2 py-0 text-[10px]"
              >
                {item.unread ? "Unread" : "Read"}
              </Badge>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{item.time}</p>
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="px-4 py-4">
          <p className="text-sm leading-6 text-foreground whitespace-pre-wrap break-words">
            {item.description}
          </p>
        </div>
      </ScrollArea>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-4 py-3">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onToggleRead(item)}
          disabled={updating || requestUpdating !== null}
        >
          {updating ? <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {item.unread ? "Mark as read" : "Mark as unread"}
        </Button>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {item.organizationAccessRequestId ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onRespondToOrganizationAccessRequest(item, "declined")
                }
                disabled={updating || requestUpdating !== null}
              >
                {requestUpdating === "declined" ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                Decline
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  onRespondToOrganizationAccessRequest(item, "accepted")
                }
                disabled={updating || requestUpdating !== null}
              >
                {requestUpdating === "accepted" ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                Accept access
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant={item.organizationAccessRequestId ? "ghost" : "default"}
            onClick={() => onOpen(item)}
            disabled={!item.href || updating || requestUpdating !== null}
          >
            {item.openLabel ?? "Open"}
          </Button>
        </div>
      </div>
    </div>
  )
}
