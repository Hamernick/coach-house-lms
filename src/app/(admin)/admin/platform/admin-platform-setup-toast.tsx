"use client"

import { useEffect } from "react"

import { toast } from "@/lib/toast"

const ADMIN_PLATFORM_SETUP_TOAST_ID = "admin-platform-setup-warning"

export function AdminPlatformSetupToast() {
  useEffect(() => {
    const id = toast.warning("Platform tools are not configured yet.", {
      id: ADMIN_PLATFORM_SETUP_TOAST_ID,
      description:
        "Add SUPABASE_MANAGEMENT_API_TOKEN to the active runtime and reload this page.",
      closeButton: true,
      duration: Number.POSITIVE_INFINITY,
    })

    return () => {
      toast.dismiss(String(id))
    }
  }, [])

  return null
}
