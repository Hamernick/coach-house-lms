"use client"

import { useEffect, useState, type Dispatch, type SetStateAction } from "react"

export function useDocumentationDraftPersistence<T>(
  key: string,
  draft: T,
  setDraft: Dispatch<SetStateAction<T>>,
  sanitize: (value: unknown) => T
) {
  const [storageReady, setStorageReady] = useState(false)
  const [storageStatus, setStorageStatus] = useState<
    "loading" | "saved" | "unavailable"
  >("loading")

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored) setDraft(sanitize(JSON.parse(stored)))
    } catch {
      setStorageStatus("unavailable")
    } finally {
      setStorageReady(true)
    }
  }, [key, sanitize, setDraft])

  useEffect(() => {
    if (!storageReady) return
    try {
      window.localStorage.setItem(key, JSON.stringify(draft))
      setStorageStatus("saved")
    } catch {
      setStorageStatus("unavailable")
    }
  }, [draft, key, storageReady])

  return { storageReady, storageStatus }
}
