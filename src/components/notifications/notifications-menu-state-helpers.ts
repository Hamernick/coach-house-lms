import { type NotificationItem } from "@/components/notifications/types"

export type NotificationViewTab = "all" | "unread"

export function countUnreadNotifications(items: NotificationItem[]) {
  return items.filter((item) => item.unread).length
}

export function filterNotificationItems(
  items: NotificationItem[],
  tab: NotificationViewTab,
) {
  if (tab === "unread") {
    return items.filter((item) => item.unread)
  }

  return items
}

export function resolveSelectedNotificationId(
  items: NotificationItem[],
  selectedId: string | null,
) {
  if (items.length === 0) {
    return null
  }

  if (selectedId && items.some((item) => item.id === selectedId)) {
    return selectedId
  }

  return items[0]?.id ?? null
}

export function markNotificationRead(
  items: NotificationItem[],
  notificationId: string,
) {
  return items.map((item) =>
    item.id === notificationId ? { ...item, unread: false } : item,
  )
}

export function markNotificationUnread(
  items: NotificationItem[],
  notificationId: string,
) {
  return items.map((item) =>
    item.id === notificationId ? { ...item, unread: true } : item,
  )
}

export function markAllNotificationsRead(items: NotificationItem[]) {
  return items.map((item) => (item.unread ? { ...item, unread: false } : item))
}
