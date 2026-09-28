"use client"
import { useRouter } from "next/navigation"
import { useVisibleRefresh } from "@/hooks/use-visible-refresh"
export function useCoachDashboardController() {
  const router = useRouter()
  useVisibleRefresh(router.refresh)
}
