import { useRef, useState, type DragEvent } from "react"

import { toast } from "@/lib/toast"

export function useDocumentSlotDrop(onFile?: (file: File) => void) {
  const [dragging, setDragging] = useState(false)
  const depth = useRef(0)

  function captureFiles(event: DragEvent<HTMLElement>) {
    if (!Array.from(event.dataTransfer.types).includes("Files")) return false
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = onFile ? "copy" : "none"
    return true
  }

  function reset() {
    depth.current = 0
    setDragging(false)
  }

  return {
    dragging: dragging && Boolean(onFile),
    handlers: {
      onDragEnter(event: DragEvent<HTMLElement>) {
        if (!captureFiles(event) || !onFile) return
        depth.current += 1
        setDragging(true)
      },
      onDragOver(event: DragEvent<HTMLElement>) {
        captureFiles(event)
      },
      onDragLeave(event: DragEvent<HTMLElement>) {
        if (!captureFiles(event)) return
        depth.current = Math.max(0, depth.current - 1)
        if (depth.current === 0) setDragging(false)
      },
      onDrop(event: DragEvent<HTMLElement>) {
        if (!captureFiles(event)) return
        reset()
        if (!onFile) return
        const files = Array.from(event.dataTransfer.files)
        if (files.length > 1) {
          toast.error("Drop one file into this document slot.")
          return
        }
        if (files[0]) onFile(files[0])
      },
    },
  }
}
