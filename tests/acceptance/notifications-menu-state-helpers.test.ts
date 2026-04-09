import { describe, expect, it } from "vitest"

import {
  countUnreadNotifications,
  filterNotificationItems,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  resolveSelectedNotificationId,
} from "@/components/notifications/notifications-menu-state-helpers"
import { type NotificationItem } from "@/components/notifications/types"

const items: NotificationItem[] = [
  {
    id: "one",
    title: "First",
    description: "First notification",
    time: "Today",
    unread: true,
    href: "/one",
    tone: "info",
  },
  {
    id: "two",
    title: "Second",
    description: "Second notification",
    time: "Yesterday",
    unread: false,
    href: "/two",
    tone: "warning",
  },
]

describe("notifications menu state helpers", () => {
  it("filters unread items without mutating the original list", () => {
    expect(filterNotificationItems(items, "all")).toEqual(items)
    expect(filterNotificationItems(items, "unread")).toEqual([items[0]])
  })

  it("resolves a stable selected notification id", () => {
    expect(resolveSelectedNotificationId(items, "two")).toBe("two")
    expect(resolveSelectedNotificationId(items, "missing")).toBe("one")
    expect(resolveSelectedNotificationId([], "one")).toBeNull()
  })

  it("applies optimistic read and unread transitions", () => {
    expect(markNotificationRead(items, "one")[0]?.unread).toBe(false)
    expect(markNotificationUnread(items, "two")[1]?.unread).toBe(true)
    expect(
      markAllNotificationsRead(items).every((item) => item.unread === false),
    ).toBe(true)
    expect(countUnreadNotifications(items)).toBe(1)
  })
})
