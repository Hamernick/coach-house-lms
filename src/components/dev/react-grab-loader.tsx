"use client"

import { useEffect } from "react"

const REACT_GRAB_RUNTIME_ID = "react-grab-runtime"
const REACT_GRAB_OPENCODE_ID = "react-grab-opencode"
const REACT_GRAB_RUNTIME_SRC = "https://unpkg.com/react-grab@0.1.1/dist/index.global.js"
const REACT_GRAB_OPENCODE_SRC = "https://unpkg.com/@react-grab/opencode@0.1.1/dist/client.global.js"

function ensureScript({
  id,
  src,
  crossOrigin,
  onLoad,
}: {
  id: string
  src: string
  crossOrigin?: "anonymous" | "use-credentials"
  onLoad?: () => void
}) {
  const existing = document.getElementById(id) as HTMLScriptElement | null
  if (existing) {
    if (existing.dataset.loaded === "1") {
      onLoad?.()
    } else if (onLoad) {
      existing.addEventListener("load", onLoad, { once: true })
    }
    return
  }

  const script = document.createElement("script")
  script.id = id
  script.src = src
  script.async = true
  if (crossOrigin) {
    script.crossOrigin = crossOrigin
  }
  script.dataset.reactGrab = "1"
  script.addEventListener(
    "load",
    () => {
      script.dataset.loaded = "1"
      onLoad?.()
    },
    { once: true },
  )

  document.head.appendChild(script)
}

export function ReactGrabLoader() {
  useEffect(() => {
    const explicitFlag = process.env.NEXT_PUBLIC_ENABLE_REACT_GRAB
    const host = window.location.hostname
    const isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0"
    const isEmbedMode = new URLSearchParams(window.location.search).get("embed") === "1"
    const shouldLoad = explicitFlag === "1" || (explicitFlag !== "0" && (process.env.NODE_ENV === "development" || isLocalHost))

    if (!shouldLoad) return
    if (isEmbedMode) return
    if (window.top !== window.self) return

    ensureScript({
      id: REACT_GRAB_RUNTIME_ID,
      src: REACT_GRAB_RUNTIME_SRC,
      crossOrigin: "anonymous",
      onLoad: () => {
        ensureScript({
          id: REACT_GRAB_OPENCODE_ID,
          src: REACT_GRAB_OPENCODE_SRC,
        })
      },
    })
  }, [])

  return null
}
