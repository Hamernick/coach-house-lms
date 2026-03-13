import type { NotificationTone } from "@/lib/notifications"

export const PLATFORM_SETUP_NOTIFICATION_ID =
  "system:supabase-management-token-missing"

export type PlatformSetupNotification = {
  id: string
  title: string
  description: string
  href: string | null
  tone: NotificationTone
  createdAt: string
  readAt: string | null
  archivedAt: string | null
}

export function hasSupabaseManagementApiToken() {
  return Boolean(process.env.SUPABASE_MANAGEMENT_API_TOKEN?.trim())
}

export function isPlatformSetupNotificationId(notificationId: string) {
  return notificationId === PLATFORM_SETUP_NOTIFICATION_ID
}

export function buildPlatformSetupNotification(
  createdAt = new Date().toISOString()
): PlatformSetupNotification {
  return {
    id: PLATFORM_SETUP_NOTIFICATION_ID,
    title: "Platform tools need setup",
    description:
      "Add SUPABASE_MANAGEMENT_API_TOKEN to enable the internal Supabase platform tools.",
    href: "/admin/platform",
    tone: "warning",
    createdAt,
    readAt: null,
    archivedAt: null,
  }
}
