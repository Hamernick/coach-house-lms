"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { listNotificationsAction, markNotificationReadAction, type AppNotification } from "@/app/actions/notifications"
import { toast } from "@/lib/toast"

import { type NotificationItem } from "@/components/notifications/types"

function formatNotificationTime(createdAt: string) {
  const date = new Date(createdAt)
  const diffMs = Date.now() - date.getTime()

  if (Number.isFinite(diffMs) && diffMs >= 0 && diffMs < 60_000) {
    return "Just now"
  }

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const dayDiff = Math.round((startOfToday - startOfDate) / (24 * 60 * 60 * 1000))

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

export function useNotificationsMenuState() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inboxItems, setInboxItems] = useState<NotificationItem[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hideBellUnreadCue, setHideBellUnreadCue] = useState(false)

  const unreadCount = useMemo(() => inboxItems.filter((item) => item.unread).length, [inboxItems])
  const showBellUnreadCue = unreadCount > 0 && !hideBellUnreadCue

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

    const nextUnreadCount = result.inbox.reduce((count, item) => count + (item.readAt == null ? 1 : 0), 0)
    if (!open && nextUnreadCount > 0) {
      setHideBellUnreadCue(false)
    }

    setInboxItems(result.inbox.map(toNotificationItem))
    setLoading(false)
  }, [open])

  useEffect(() => {
    if (!mounted) return
    void refreshNotifications()
  }, [mounted, refreshNotifications])

  useEffect(() => {
    if (!open) return
    void refreshNotifications()
  }, [open, refreshNotifications])

  const markReadOptimistic = useCallback((notificationId: string) => {
    setInboxItems((prev) => prev.map((item) => (item.id === notificationId ? { ...item, unread: false } : item)))
  }, [])

  const handlePrimaryAction = useCallback(
    (item: NotificationItem) => {
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
    },
    [markReadOptimistic, refreshNotifications, router],
  )

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setHideBellUnreadCue(true)
    }
  }, [])

  return {
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
  }
}
