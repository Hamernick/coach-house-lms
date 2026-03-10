"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

import { NotificationToneIcon } from "@/components/notifications/notification-tone-icon"
import { type NotificationItem } from "@/components/notifications/types"

type NotificationsListProps = {
  items: NotificationItem[]
  loading: boolean
  error: string | null
  onRetry?: () => void
  emptyLabel?: string
  onPrimaryAction: (item: NotificationItem) => void
}

export function NotificationsList({
  items,
  loading,
  error,
  onRetry,
  emptyLabel = "Inbox is empty",
  onPrimaryAction,
}: NotificationsListProps) {
  if (loading) {
    return (
      <ScrollArea className="h-[360px]">
        <div className="space-y-2 px-4 py-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="border-border/60 bg-background/60 flex items-start gap-3 rounded-lg border px-3 py-3">
              <Skeleton className="mt-1 h-8 w-8 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    )
  }

  if (error) {
    return (
      <div className="text-muted-foreground px-4 py-6 text-center text-xs">
        Unable to load notifications.
        <div className="mt-3">
          <Button type="button" size="sm" variant="outline" onClick={onRetry ?? (() => window.location.reload())}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return <div className="text-muted-foreground px-4 py-6 text-center text-xs">{emptyLabel}</div>
  }

  return (
    <ScrollArea className="h-[360px]">
      <div className="divide-border/60 divide-y">
        {items.map((item) => (
          <div key={item.id} className="group hover:bg-accent/40 flex items-start gap-3 px-4 py-3 transition">
            <Button
              type="button"
              variant="ghost"
              className="h-auto min-w-0 flex-1 justify-start gap-3 whitespace-normal p-0 text-left hover:bg-transparent"
              onClick={() => onPrimaryAction(item)}
            >
              <NotificationToneIcon tone={item.tone} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-foreground text-sm font-medium">{item.title}</p>
                  {item.unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500 dark:bg-sky-400" aria-hidden /> : null}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">{item.description}</p>
                <p className="text-muted-foreground mt-2 text-[11px]">{item.time}</p>
              </div>
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
