"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { DecisionEditorOrigin } from "../components/decision-canvas-editor"

export function useDecisionCanvasExpansion({
  editorId,
  onSelect,
  onClose,
  focusStep,
}: {
  editorId: string | null
  onSelect: (id: string) => void
  onClose: () => void
  focusStep: (id: string) => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const [origin, setOrigin] = useState<DecisionEditorOrigin | null>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const selection = useRef<string | null>(null)
  const fromFooter = useRef(false)
  const expandedId = useRef(editorId)
  expandedId.current = editorId

  const findStep = useCallback(
    (id: string) => {
      const root = container.current
      const escaped = CSS.escape(id)
      return (
        root?.querySelector<HTMLButtonElement>(
          `[data-decision-list-step="${escaped}"]`
        ) ??
        root?.querySelector<HTMLButtonElement>(
          `.react-flow__node[data-id="${escaped}"] [data-decision-node-button]`
        ) ??
        null
      )
    },
    [container]
  )

  const measure = useCallback(
    (button: HTMLButtonElement | null) => {
      const root = container.current
      if (!root || !button || !root.clientWidth || !root.clientHeight)
        return null
      const bounds = root.getBoundingClientRect()
      const card = button.getBoundingClientRect()
      return {
        x: Math.max(
          0,
          Math.min(
            root.clientWidth - card.width,
            card.left - bounds.left - root.clientLeft
          )
        ),
        y: Math.max(
          0,
          Math.min(
            root.clientHeight - card.height,
            card.top - bounds.top - root.clientTop
          )
        ),
        scaleX: Math.min(1, card.width / root.clientWidth),
        scaleY: Math.min(1, card.height / root.clientHeight),
      }
    },
    [container]
  )

  const selectStep = useCallback(
    (id: string, button: HTMLButtonElement) => {
      selection.current = id
      trigger.current = button
      fromFooter.current = !container.current?.contains(button)
      setOrigin(measure(fromFooter.current ? findStep(id) : button))
      onSelect(id)
    },
    [container, findStep, measure, onSelect]
  )

  useEffect(() => {
    if (!editorId || editorId === selection.current) return
    selection.current = editorId
    trigger.current = findStep(editorId)
    fromFooter.current = false
    setOrigin(measure(trigger.current))
  }, [editorId, findStep, measure])

  const collapse = useCallback(() => {
    if (selection.current) setOrigin(measure(findStep(selection.current)))
    onClose()
  }, [findStep, measure, onClose])

  const restoreFocus = useCallback(() => {
    if (expandedId.current) return
    let target = trigger.current
    if (!target?.isConnected && fromFooter.current) {
      target =
        container.current
          ?.closest("section")
          ?.querySelector<HTMLButtonElement>("[data-canvas-start]") ?? null
    }
    if (!target?.isConnected) return
    if (container.current?.contains(target)) {
      const viewport = container.current.getBoundingClientRect()
      const bounds = target.getBoundingClientRect()
      if (
        selection.current &&
        target.hasAttribute("data-decision-node-button") &&
        (bounds.top < viewport.top ||
          bounds.bottom > viewport.bottom ||
          bounds.left < viewport.left ||
          bounds.right > viewport.right)
      ) {
        focusStep(selection.current)
      }
      if (target.hasAttribute("data-decision-list-step"))
        target.scrollIntoView({ block: "nearest" })
    }
    target.focus({ preventScroll: true })
  }, [container, focusStep])

  return { container, origin, selectStep, collapse, restoreFocus }
}
