"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import {
  listNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  markNotificationUnreadAction,
  type AppNotification,
} from "@/app/actions/notifications"
import { toast } from "@/lib/toast"

import {
  countUnreadNotifications,
  filterNotificationItems,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  resolveSelectedNotificationId,
  type NotificationViewTab,
} from "@/components/notifications/notifications-menu-state-helpers"
import { toNotificationItem } from "@/components/notifications/notification-item-mapper"
import { type NotificationItem } from "@/components/notifications/types"

export function useNotificationsMenuState() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<NotificationViewTab>("all")
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inboxItems, setInboxItems] = useState<NotificationItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [selectedUpdating, setSelectedUpdating] = useState(false)

  const filteredItems = useMemo(
    () => filterNotificationItems(inboxItems, tab),
    [inboxItems, tab],
  )
  const selectedItem = useMemo(
    () => filteredItems.find((item) => item.id === selectedId) ?? null,
    [filteredItems, selectedId],
  )
  const unreadCount = useMemo(() => countUnreadNotifications(inboxItems), [inboxItems])
  const showBellUnreadCue = unreadCount > 0

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

  useEffect(() => {
    const nextSelectedId = resolveSelectedNotificationId(filteredItems, selectedId)
    if (nextSelectedId !== selectedId) {
      setSelectedId(nextSelectedId)
    }
  }, [filteredItems, selectedId])

  const markReadOptimistic = useCallback((notificationId: string) => {
    setInboxItems((prev) => markNotificationRead(prev, notificationId))
  }, [])

  const markUnreadOptimistic = useCallback((notificationId: string) => {
    setInboxItems((prev) => markNotificationUnread(prev, notificationId))
  }, [])

  const handleSelect = useCallback(
    (item: NotificationItem) => {
      setSelectedId(item.id)

      if (item.unread) {
        markReadOptimistic(item.id)
        void markNotificationReadAction(item.id).then((result) => {
          if ("error" in result) {
            toast.error(result.error)
            void refreshNotifications()
          }
        })
      }

    },
    [markReadOptimistic, refreshNotifications],
  )

  const handleOpenSelected = useCallback(
    (item: NotificationItem) => {
      if (!item.href) return
      setOpen(false)
      router.push(item.href)
    },
    [router],
  )

  const handleToggleRead = useCallback(
    (item: NotificationItem) => {
      setSelectedUpdating(true)

      if (item.unread) {
        markReadOptimistic(item.id)
        void markNotificationReadAction(item.id).then((result) => {
          setSelectedUpdating(false)
          if ("error" in result) {
            toast.error(result.error)
            void refreshNotifications()
          }
        })
        return
      }

      markUnreadOptimistic(item.id)
      void markNotificationUnreadAction(item.id).then((result) => {
        setSelectedUpdating(false)
        if ("error" in result) {
          toast.error(result.error)
          void refreshNotifications()
        }
      })
    },
    [markReadOptimistic, markUnreadOptimistic, refreshNotifications],
  )

  const handleMarkAllRead = useCallback(() => {
    if (unreadCount === 0) return

    setBulkUpdating(true)
    setInboxItems((prev) => markAllNotificationsRead(prev))

    void markAllNotificationsReadAction().then((result) => {
      setBulkUpdating(false)
      if ("error" in result) {
        toast.error(result.error)
        void refreshNotifications()
      }
    })
  }, [refreshNotifications, unreadCount])

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSelectedUpdating(false)
    }
  }, [])

  return {
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
  }
}
