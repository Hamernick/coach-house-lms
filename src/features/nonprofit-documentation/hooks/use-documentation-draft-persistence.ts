"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"

export function useDocumentationDraftPersistence<T>(
  key: string,
  draft: T,
  setDraft: Dispatch<SetStateAction<T>>,
  sanitize: (value: unknown) => T
) {
  const [storageStatus, setStorageStatus] = useState<
    "loading" | "saved" | "unavailable"
  >("loading")
  const [readState, setReadState] = useState<"loading" | "ready" | "failed">(
    "loading"
  )
  const [resetVersion, setResetVersion] = useState(0)
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null)
  const readFailedRef = useRef(false)
  const leaveConfirmedRef = useRef(false)
  const lastPathRef = useRef<string | null>(null)
  const initialDraftSnapshot = useRef(JSON.stringify(draft)).current
  const serializedDraft = useMemo(() => JSON.stringify(draft), [draft])
  const storageReady = readState !== "loading"
  const hasUnsavedChanges =
    savedSnapshot !== null && serializedDraft !== savedSnapshot

  const authorizeResetAfterReadFailure = useCallback(() => {
    readFailedRef.current = false
    setReadState("ready")
    setResetVersion((version) => version + 1)
  }, [])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored) {
        const restored = sanitize(JSON.parse(stored))
        setDraft(restored)
        setSavedSnapshot(JSON.stringify(restored))
      } else {
        setSavedSnapshot(initialDraftSnapshot)
      }
      setReadState("ready")
    } catch {
      readFailedRef.current = true
      setSavedSnapshot(initialDraftSnapshot)
      setStorageStatus("unavailable")
      setReadState("failed")
    }
  }, [initialDraftSnapshot, key, sanitize, setDraft])

  useEffect(() => {
    if (readState !== "ready" || readFailedRef.current) return
    try {
      window.localStorage.setItem(key, serializedDraft)
      setSavedSnapshot(serializedDraft)
      setStorageStatus("saved")
    } catch {
      setStorageStatus("unavailable")
    }
  }, [key, readState, resetVersion, serializedDraft])

  useEffect(() => {
    if (!hasUnsavedChanges || storageStatus !== "unavailable") return

    const confirmLeaving = () =>
      window.confirm(
        "This plan has unsaved changes because browser storage is unavailable. Leave and lose these changes?"
      )
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (leaveConfirmedRef.current) return
      event.preventDefault()
      event.returnValue = ""
    }
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      if (!(event.target instanceof Element)) return
      const anchor = event.target.closest("a[href]") as HTMLAnchorElement | null
      if (!anchor || (anchor.target && anchor.target !== "_self")) return
      if (anchor.hasAttribute("download")) return
      const href = anchor.getAttribute("href")
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      )
        return
      if (confirmLeaving()) {
        if (anchor.origin === window.location.origin) {
          lastPathRef.current = anchor.pathname
        } else {
          leaveConfirmedRef.current = true
        }
        return
      }
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
    }
    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target
      if (!(form instanceof HTMLFormElement)) return
      if (form.target && form.target !== "_self") return
      if (confirmLeaving()) {
        if (new URL(form.action).origin !== window.location.origin)
          leaveConfirmedRef.current = true
        return
      }
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
    }
    lastPathRef.current = window.location.pathname
    const handlePopState = (event: PopStateEvent) => {
      const destinationPath = window.location.pathname
      if (destinationPath === lastPathRef.current) return
      if (confirmLeaving()) {
        lastPathRef.current = destinationPath
        return
      }
      event.stopImmediatePropagation()
      window.history.forward()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState, true)
    document.addEventListener("click", handleClick, true)
    document.addEventListener("submit", handleSubmit, true)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState, true)
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("submit", handleSubmit, true)
    }
  }, [hasUnsavedChanges, storageStatus])

  return { storageReady, storageStatus, authorizeResetAfterReadFailure }
}
