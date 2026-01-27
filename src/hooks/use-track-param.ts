"use client"

import { useCallback, useEffect, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

type UseTrackParamOptions = {
  keys: string[]
  fallbackKey?: string | null
  paramName?: string
}

type UseTrackParamResult = {
  selectedKey: string
  setSelectedKey: (nextKey: string) => void
}

export function useTrackParam({
  keys,
  fallbackKey,
  paramName = "track",
}: UseTrackParamOptions): UseTrackParamResult {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const validKeys = useMemo(() => new Set(keys.filter(Boolean)), [keys])
  const paramValue = searchParams.get(paramName) ?? ""
  const fallbackValue = fallbackKey && validKeys.has(fallbackKey) ? fallbackKey : ""
  const selectedKey = validKeys.has(paramValue) ? paramValue : fallbackValue || keys[0] || ""

  const setSelectedKey = useCallback(
    (nextKey: string) => {
      if (!nextKey || nextKey === paramValue) return
      const params = new URLSearchParams(searchParams.toString())
      params.set(paramName, nextKey)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [paramName, paramValue, pathname, router, searchParams],
  )

  useEffect(() => {
    if (!selectedKey || selectedKey === paramValue) return
    const params = new URLSearchParams(searchParams.toString())
    params.set(paramName, selectedKey)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [paramName, paramValue, pathname, router, searchParams, selectedKey])

  return { selectedKey, setSelectedKey }
}
