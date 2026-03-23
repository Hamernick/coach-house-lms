"use client"

import * as React from "react"
import Bell from "lucide-react/dist/esm/icons/bell"

import { NotificationsList } from "@/components/notifications/notifications-list"
import { useNotificationsMenuState } from "@/components/notifications/hooks/use-notifications-menu-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const NotificationsBellButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button> & {
    showBellUnreadCue: boolean
  }
>(function NotificationsBellButton(
  { showBellUnreadCue, className, ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("relative", className)}
      aria-label="Notifications"
      {...props}
    >
      <Bell className="h-4 w-4" />
      {showBellUnreadCue ? (
        <span
          className="absolute top-2 right-2 h-2 w-2 rounded-full bg-sky-500 dark:bg-sky-400"
          aria-hidden
        />
      ) : null}
    </Button>
  )
})

export function NotificationsMenu() {
  const {
    open,
    mounted,
    loading,
    inboxItems,
    loadError,
    unreadCount,
    showBellUnreadCue,
    refreshNotifications,
    handlePrimaryAction,
    handleOpenChange,
  } = useNotificationsMenuState()

  if (!mounted) {
    return <NotificationsBellButton showBellUnreadCue={showBellUnreadCue} />
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <NotificationsBellButton showBellUnreadCue={showBellUnreadCue} />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="border-border/60 flex items-center justify-between border-b px-4 py-3">
          <p className="text-foreground text-sm font-semibold">Notifications</p>
          {unreadCount > 0 ? (
            <Badge variant="secondary" className="rounded-full">
              {unreadCount} new
            </Badge>
          ) : null}
        </div>

        <div className="border-border/60 flex items-center justify-between border-b px-4 py-2">
          <p className="text-xs font-medium text-muted-foreground">Inbox</p>
          <Badge variant="secondary" className="rounded-full">
            {inboxItems.length}
          </Badge>
        </div>
        <NotificationsList
          items={inboxItems}
          loading={loading}
          error={loadError}
          onRetry={() => void refreshNotifications()}
          onPrimaryAction={handlePrimaryAction}
        />
      </PopoverContent>
    </Popover>
  )
}
