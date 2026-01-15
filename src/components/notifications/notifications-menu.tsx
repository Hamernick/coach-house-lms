"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Bell from "lucide-react/dist/esm/icons/bell"
import MessageCircle from "lucide-react/dist/esm/icons/message-circle"
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle"
import Sparkles from "lucide-react/dist/esm/icons/sparkles"
import ArchiveIcon from "lucide-react/dist/esm/icons/archive"
import InboxIcon from "lucide-react/dist/esm/icons/inbox"

import {
  archiveAllNotificationsAction,
  archiveNotificationAction,
  listNotificationsAction,
  markNotificationReadAction,
  unarchiveNotificationAction,
  type AppNotification,
  type NotificationTone,
} from "@/app/actions/notifications"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

type NotificationItem = {
  id: string
  title: string
  description: string
  time: string
  tone?: NotificationTone
  unread?: boolean
  href?: string | null
}

function formatNotificationTime(createdAt: string) {
  const date = new Date(createdAt)
  const diffMs = Date.now() - date.getTime()

  if (Number.isFinite(diffMs) && diffMs >= 0 && diffMs < 60_000)
    return "Just now"

  const now = new Date()
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime()
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime()
  const dayDiff = Math.round(
    (startOfToday - startOfDate) / (24 * 60 * 60 * 1000)
  )

  if (dayDiff === 0) return "Today"
  if (dayDiff === 1) return "Yesterday"

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  })
}

function toNotificationItem(item: AppNotification): NotificationItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    href: item.href,
    tone: item.tone ?? "info",
    time: formatNotificationTime(item.createdAt),
    unread: item.readAt == null,
  }
}

export function NotificationsMenu() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inboxItems, setInboxItems] = useState<NotificationItem[]>([])
  const [archiveItems, setArchiveItems] = useState<NotificationItem[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const unreadCount = useMemo(
    () => inboxItems.filter((item) => item.unread).length,
    [inboxItems]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const refreshNotifications = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const result = await listNotificationsAction()
    if ("error" in result) {
      setLoadError(result.error)
      toast.error(result.error)
      setLoading(false)
      return
    }

    setInboxItems(result.inbox.map(toNotificationItem))
    setArchiveItems(result.archive.map(toNotificationItem))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!mounted) return
    void refreshNotifications()
  }, [mounted, refreshNotifications])

  useEffect(() => {
    if (!open) return
    void refreshNotifications()
  }, [open, refreshNotifications])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span
            className="bg-destructive absolute top-2 right-2 h-2 w-2 rounded-full"
            aria-hidden
          />
        ) : null}
      </Button>
    )
  }

  function markReadOptimistic(notificationId: string) {
    setInboxItems((prev) =>
      prev.map((item) =>
        item.id === notificationId ? { ...item, unread: false } : item
      )
    )
  }

  function handleOpenItem(item: NotificationItem) {
    if (item.unread) {
      markReadOptimistic(item.id)
      void markNotificationReadAction(item.id).then((result) => {
        if ("error" in result) {
          toast.error(result.error)
          void refreshNotifications()
        }
      })
    }

    if (item.href) {
      setOpen(false)
      router.push(item.href)
    }
  }

  function handleArchiveItem(notificationId: string) {
    setInboxItems((prevInbox) => {
      const nextInbox = prevInbox.filter((item) => item.id !== notificationId)
      const archived = prevInbox.find((item) => item.id === notificationId)
      if (archived) {
        setArchiveItems((prevArchive) => [archived, ...prevArchive])
      }
      return nextInbox
    })

    startTransition(async () => {
      const result = await archiveNotificationAction(notificationId)
      if ("error" in result) {
        toast.error(result.error)
        await refreshNotifications()
      }
    })
  }

  function handleUnarchiveItem(notificationId: string) {
    setArchiveItems((prevArchive) => {
      const nextArchive = prevArchive.filter(
        (item) => item.id !== notificationId
      )
      const restored = prevArchive.find((item) => item.id === notificationId)
      if (restored) {
        setInboxItems((prevInbox) => [restored, ...prevInbox])
      }
      return nextArchive
    })

    startTransition(async () => {
      const result = await unarchiveNotificationAction(notificationId)
      if ("error" in result) {
        toast.error(result.error)
        await refreshNotifications()
      }
    })
  }

  function handleArchiveAll() {
    if (inboxItems.length === 0) return
    setArchiveItems((prevArchive) => [...inboxItems, ...prevArchive])
    setInboxItems([])

    startTransition(async () => {
      const result = await archiveAllNotificationsAction()
      if ("error" in result) {
        toast.error(result.error)
        await refreshNotifications()
      }
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span
              className="bg-destructive absolute top-2 right-2 h-2 w-2 rounded-full"
              aria-hidden
            />
          ) : null}
        </Button>
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

        <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="border-border/60 w-full justify-start gap-2 rounded-none border-b bg-transparent px-2 py-1">
            <TabsTrigger value="inbox" className="gap-2">
              Inbox
              <Badge variant="secondary" className="rounded-full">
                {inboxItems.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="archive" className="gap-2">
              Archive
              <Badge variant="secondary" className="rounded-full">
                {archiveItems.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="p-0">
            <NotificationsList
              items={inboxItems}
              loading={loading}
              error={loadError}
              onRetry={() => void refreshNotifications()}
              actionLabel="Archive"
              actionIcon={ArchiveIcon}
              actionDisabled={pending}
              onPrimaryAction={handleOpenItem}
              onSecondaryAction={handleArchiveItem}
            />
          </TabsContent>
          <TabsContent value="archive" className="p-0">
            <NotificationsList
              items={archiveItems}
              loading={loading}
              error={loadError}
              onRetry={() => void refreshNotifications()}
              emptyLabel="Archive is empty"
              actionLabel="Unarchive"
              actionIcon={InboxIcon}
              actionDisabled={pending}
              onPrimaryAction={handleOpenItem}
              onSecondaryAction={handleUnarchiveItem}
            />
          </TabsContent>
        </Tabs>

        <div className="border-border/60 border-t px-4 py-2">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-center text-xs"
            disabled={pending || inboxItems.length === 0}
            onClick={handleArchiveAll}
          >
            Archive all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function NotificationsList({
  items,
  loading,
  error,
  onRetry,
  emptyLabel = "Inbox is empty",
  actionLabel,
  actionIcon: ActionIcon,
  actionDisabled,
  onPrimaryAction,
  onSecondaryAction,
}: {
  items: NotificationItem[]
  loading: boolean
  error: string | null
  onRetry?: () => void
  emptyLabel?: string
  actionLabel: string
  actionIcon: typeof ArchiveIcon
  actionDisabled: boolean
  onPrimaryAction: (item: NotificationItem) => void
  onSecondaryAction: (notificationId: string) => void
}) {
  if (loading) {
    return (
      <ScrollArea className="h-[360px]">
        <div className="space-y-2 px-4 py-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="border-border/60 bg-background/60 flex items-start gap-3 rounded-lg border px-3 py-3"
            >
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
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRetry ?? (() => window.location.reload())}
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground px-4 py-6 text-center text-xs">
        {emptyLabel}
      </div>
    )
  }

  return (
    <ScrollArea className="h-[360px]">
      <div className="divide-border/60 divide-y">
        {items.map((item) => (
          <div
            key={item.id}
            className="group hover:bg-accent/40 flex items-start gap-3 px-4 py-3 transition"
          >
            <button
              type="button"
              className="flex min-w-0 flex-1 items-start gap-3 text-left"
              onClick={() => onPrimaryAction(item)}
            >
              <span
                className={cn(
                  "mt-1 flex h-8 w-8 items-center justify-center rounded-full border text-xs",
                  toneStyles(item.tone)
                )}
              >
                {item.tone === "warning" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : null}
                {item.tone === "info" ? <Sparkles className="h-4 w-4" /> : null}
                {item.tone === "success" ? (
                  <MessageCircle className="h-4 w-4" />
                ) : null}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-foreground text-sm font-medium">
                    {item.title}
                  </p>
                  {item.unread ? (
                    <span
                      className="bg-primary h-2 w-2 rounded-full"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {item.description}
                </p>
                <p className="text-muted-foreground mt-2 text-[11px]">
                  {item.time}
                </p>
              </div>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={actionDisabled}
              className="text-muted-foreground mt-1 h-8 w-8 opacity-0 transition group-hover:opacity-100 disabled:opacity-40"
              aria-label={actionLabel}
              onClick={() => onSecondaryAction(item.id)}
            >
              <ActionIcon className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

function toneStyles(tone?: NotificationItem["tone"]) {
  switch (tone) {
    case "warning":
      return "border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400"
    case "success":
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
    default:
      return "border-sky-500/40 bg-sky-500/15 text-sky-600 dark:text-sky-400"
  }
}
