import { useEffect, useMemo, useState } from "react"

type UseDocumentsBannerStateArgs = {
  userId: string
}

export function useDocumentsBannerState({ userId }: UseDocumentsBannerStateArgs) {
  const [isBannerVisible, setIsBannerVisible] = useState(false)

  const bannerStorageKey = useMemo(
    () => `documents-command-center-dismissed:v1:${userId}`,
    [userId],
  )

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(bannerStorageKey) === "1"
      setIsBannerVisible(!dismissed)
    } catch {
      setIsBannerVisible(true)
    }
  }, [bannerStorageKey])

  return {
    isBannerVisible,
  }
}
