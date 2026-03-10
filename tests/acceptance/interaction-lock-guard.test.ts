import { afterEach, describe, expect, it, vi } from "vitest"

import {
  hasOpenInteractionLayer,
  releaseStaleInteractionLocks,
  scheduleInteractionLockGuardOnClose,
} from "@/lib/ui/interaction-lock-guard"

type MockStyle = {
  overflow: string
  pointerEvents: string
  paddingRight: string
  removeProperty: (name: string) => void
}

type MockElement = {
  style: MockStyle
  removeAttribute: (name: string) => void
}

function createStyle(initial: Partial<Record<"overflow" | "pointerEvents" | "padding-right", string>> = {}) {
  const style: MockStyle = {
    overflow: initial.overflow ?? "",
    pointerEvents: initial.pointerEvents ?? "",
    paddingRight: initial["padding-right"] ?? "",
    removeProperty(name) {
      if (name === "padding-right") {
        style.paddingRight = ""
      }
    },
  }
  return style
}

function createElement(style: MockStyle) {
  const removedAttributes = new Set<string>()
  const element: MockElement = {
    style,
    removeAttribute(name) {
      removedAttributes.add(name)
    },
  }
  return { element, removedAttributes }
}

function createMockDocument({
  hasOpenLayer,
}: {
  hasOpenLayer: boolean
}) {
  const bodyStyle = createStyle({ overflow: "hidden", pointerEvents: "none", "padding-right": "15px" })
  const htmlStyle = createStyle({ overflow: "hidden", "padding-right": "15px" })
  const { element: body, removedAttributes: bodyRemovedAttributes } = createElement(bodyStyle)
  const { element: documentElement, removedAttributes: htmlRemovedAttributes } = createElement(htmlStyle)

  const document = {
    querySelector: vi.fn().mockImplementation(() => (hasOpenLayer ? ({}) : null)),
    body,
    documentElement,
  } as unknown as Document

  return {
    document,
    bodyStyle,
    htmlStyle,
    bodyRemovedAttributes,
    htmlRemovedAttributes,
  }
}

describe("interaction lock guard", () => {
  const originalDocument = globalThis.document

  afterEach(() => {
    if (typeof originalDocument === "undefined") {
      Reflect.deleteProperty(globalThis, "document")
    } else {
      Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: originalDocument,
        writable: true,
      })
    }
  })

  it("detects open interaction layers", () => {
    const mock = createMockDocument({ hasOpenLayer: true })
    expect(hasOpenInteractionLayer(mock.document)).toBe(true)
  })

  it("clears stale body/html interaction locks when no layer is open", () => {
    const mock = createMockDocument({ hasOpenLayer: false })
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: mock.document,
      writable: true,
    })

    releaseStaleInteractionLocks()

    expect(mock.bodyStyle.overflow).toBe("")
    expect(mock.bodyStyle.pointerEvents).toBe("")
    expect(mock.bodyStyle.paddingRight).toBe("")
    expect(mock.htmlStyle.overflow).toBe("")
    expect(mock.htmlStyle.paddingRight).toBe("")
    expect(mock.bodyRemovedAttributes.has("data-scroll-locked")).toBe(true)
    expect(mock.htmlRemovedAttributes.has("data-scroll-locked")).toBe(true)
  })

  it("keeps locks when an interaction layer is still open", () => {
    const mock = createMockDocument({ hasOpenLayer: true })
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: mock.document,
      writable: true,
    })

    releaseStaleInteractionLocks()

    expect(mock.bodyStyle.overflow).toBe("hidden")
    expect(mock.bodyStyle.pointerEvents).toBe("none")
    expect(mock.bodyStyle.paddingRight).toBe("15px")
    expect(mock.htmlStyle.overflow).toBe("hidden")
    expect(mock.htmlStyle.paddingRight).toBe("15px")
    expect(mock.bodyRemovedAttributes.size).toBe(0)
    expect(mock.htmlRemovedAttributes.size).toBe(0)
  })

  it("schedules cleanup only when interaction closes", () => {
    const schedule = vi.fn()
    const onOpenChange = vi.fn()

    scheduleInteractionLockGuardOnClose({ open: true, schedule, onOpenChange })
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(schedule).not.toHaveBeenCalled()

    scheduleInteractionLockGuardOnClose({ open: false, schedule, onOpenChange })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(schedule).toHaveBeenCalledTimes(1)
  })
})
