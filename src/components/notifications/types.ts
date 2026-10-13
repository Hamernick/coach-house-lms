import { type NotificationTone } from "@/app/actions/notifications"

export type NotificationItem = {
  id: string
  title: string
  description: string
  time: string
  tone?: NotificationTone
  unread?: boolean
  href?: string | null
}
