import "server-only"

import { cookies } from "next/headers"

import {
  APP_SIDEBAR_STATE_COOKIE,
  resolveAppSidebarDefaultOpen,
} from "@/components/app-shell/sidebar-state"

export async function readAppSidebarDefaultOpen(): Promise<boolean> {
  const cookieStore = await cookies()
  return resolveAppSidebarDefaultOpen(
    cookieStore.get(APP_SIDEBAR_STATE_COOKIE)?.value
  )
}
