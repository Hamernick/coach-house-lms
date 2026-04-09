"use client"

import * as React from "react"
import Bell from "lucide-react/dist/esm/icons/bell"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"

import { NotificationPreview } from "@/components/notifications/notification-preview"
import { NotificationsList } from "@/components/notifications/notifications-list"
import { useNotificationsMenuState } from "@/components/notifications/hooks/use-notifications-menu-state"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const isMobile = useIsMobile()
  const {
    open,
    tab,
    mounted,
    loading,
    inboxItems,
    filteredItems,
    selectedId,
    selectedItem,
    loadError,
    bulkUpdating,
    selectedUpdating,
    unreadCount,
    showBellUnreadCue,
    refreshNotifications,
    setTab,
    handleSelect,
    handleOpenSelected,
    handleToggleRead,
    handleMarkAllRead,
    handleOpenChange,
  } = useNotificationsMenuState()

  if (!mounted) {
    return <NotificationsBellButton showBellUnreadCue={showBellUnreadCue} />
  }

  const notificationsBody = (
    <>
      <div className="border-border/60 flex items-center justify-between border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <p className="text-foreground truncate text-sm font-semibold">Notifications</p>
          <Badge variant="secondary" className="rounded-full">
            {inboxItems.length}
          </Badge>
          {unreadCount > 0 ? (
            <Badge variant="secondary" className="rounded-full">
              {unreadCount} unread
            </Badge>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => handleMarkAllRead()}
          disabled={bulkUpdating || unreadCount === 0}
          className="shrink-0"
        >
          {bulkUpdating ? (
            <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          <span className="hidden sm:inline">Mark all read</span>
          <span className="sm:hidden">Mark read</span>
        </Button>
      </div>

      <div className="border-border/60 border-b px-4 py-2">
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as typeof tab)}
          className="w-fit"
        >
          <TabsList className="inline-flex h-8 w-fit max-w-full items-center self-start rounded-full border border-border/50 bg-muted px-1 py-0.5">
            <TabsTrigger
              value="all"
              className="h-7 rounded-full px-3 text-xs data-[state=active]:bg-background"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="h-7 rounded-full px-3 text-xs data-[state=active]:bg-background"
            >
              Unread
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="min-h-0 flex-1 md:max-w-[20rem] md:basis-[20rem]">
          <NotificationsList
            items={filteredItems}
            selectedId={selectedId}
            loading={loading}
            error={loadError}
            onRetry={() => void refreshNotifications()}
            emptyLabel={tab === "unread" ? "No unread notifications." : "Inbox is empty."}
            onSelect={handleSelect}
          />
        </div>
        <NotificationPreview
          item={selectedItem}
          loading={loading}
          updating={selectedUpdating}
          onOpen={handleOpenSelected}
          onToggleRead={handleToggleRead}
        />
      </div>
    </>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          <NotificationsBellButton showBellUnreadCue={showBellUnreadCue} />
        </DrawerTrigger>
        <DrawerContent className="max-h-[85dvh] rounded-t-3xl p-0">
          <DrawerTitle className="sr-only">Notifications</DrawerTitle>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {notificationsBody}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <NotificationsBellButton showBellUnreadCue={showBellUnreadCue} />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(92vw,42rem)] p-0"
      >
        <div className="flex max-h-[min(72vh,34rem)] min-h-[24rem] flex-col overflow-hidden">
          {notificationsBody}
        </div>
      </PopoverContent>
    </Popover>
  )
}
