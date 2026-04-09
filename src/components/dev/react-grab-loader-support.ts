"use client"

import { buildReactGrabClipboardOutput } from "@/components/dev/react-grab-loader-clipboard"
import {
  buildReactGrabResolutionTrace,
  resolveReactGrabSelectedSurfaceElement,
  resolveReactGrabSemanticTarget,
  type ReactGrabApi,
  type ReactGrabPlugin,
  type ReactGrabResolutionTrace,
  type ReactGrabSelectionContext,
} from "@/components/dev/react-grab-loader-resolution"

export type { ReactGrabApi, ReactGrabPlugin, ReactGrabResolutionTrace }
export { resolveReactGrabSemanticTarget }

let latestReactGrabSelectionContext: ReactGrabSelectionContext | null = null

export function createReactGrabClipboardTransformer({
  api,
  getSelectionContext = () => latestReactGrabSelectionContext,
}: {
  api: ReactGrabApi
  getSelectionContext?: () => ReactGrabSelectionContext | null
}) {
  return async (content: string, elements: Element[]) => {
    const selectionContext = getSelectionContext()

    try {
      return await buildReactGrabClipboardOutput({
        api,
        content,
        elements,
        selectionContext,
      })
    } finally {
      latestReactGrabSelectionContext = null
    }
  }
}

export function createReactGrabSemanticSelectionHandler({
  copyElement,
  resolveTarget = resolveReactGrabSemanticTarget,
  onResolved,
}: {
  copyElement: ReactGrabApi["copyElement"]
  resolveTarget?: (element: Element) => Element | null
  onResolved?: (trace: ReactGrabResolutionTrace) => void
}) {
  return (element: Element) => {
    const target = resolveTarget(element)
    const resolutionMode =
      target === element
        ? "direct-anchor"
        : target
          ? "linked-surface"
          : element.closest("[data-react-grab-link-id]")
            ? "legacy-fallback"
            : "none"
    const trace = buildReactGrabResolutionTrace(
      element,
      target,
      resolutionMode,
    )
    latestReactGrabSelectionContext = {
      selectedElement: element,
      selectedSurfaceElement: resolveReactGrabSelectedSurfaceElement(element),
      targetElement: target,
      trace,
    }
    onResolved?.(trace)
    if (!target || target === element) return
    return copyElement(target)
  }
}
