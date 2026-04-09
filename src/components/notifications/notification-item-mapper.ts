import { type AppNotification } from "@/app/actions/notifications"
import { type NotificationItem } from "@/components/notifications/types"

export function formatNotificationTime(createdAt: string) {
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

export function toNotificationItem(item: AppNotification): NotificationItem {
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
