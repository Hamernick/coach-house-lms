"use client"

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react"

type RightRailSlotEntry = {
  id: string
  content: ReactNode
  priority: number
  order: number
  align: "top" | "bottom"
}

type RightRailStore = {
  getContentSnapshot: () => ReactNode | null
  getPresenceSnapshot: () => boolean
  subscribeContent: (listener: () => void) => () => void
  subscribePresence: (listener: () => void) => () => void
  setSlot: (id: string, content: ReactNode | null, priority?: number, align?: "top" | "bottom") => void
  removeSlot: (id: string) => void
}

const RightRailContext = createContext<RightRailStore | null>(null)

function createRightRailStore(): RightRailStore {
  const slots = new Map<string, RightRailSlotEntry>()
  const contentListeners = new Set<() => void>()
  const presenceListeners = new Set<() => void>()
  let order = 0
  let contentSnapshot: ReactNode | null = null
  let presenceSnapshot = false

  const notify = (listeners: Set<() => void>) => {
    listeners.forEach((listener) => listener())
  }

  const computeSnapshot = () => {
    if (slots.size === 0) return null
    const ordered = Array.from(slots.values()).sort((a, b) => {
      const priorityDelta = a.priority - b.priority
      if (priorityDelta !== 0) return priorityDelta
      return a.order - b.order
    })
    if (ordered.length === 1) return ordered[0]?.content ?? null
    const topEntries = ordered.filter((entry) => entry.align !== "bottom")
    const bottomEntries = ordered.filter((entry) => entry.align === "bottom")
    return (
      <div className="flex min-h-full flex-col gap-[var(--shell-rail-gap,1rem)]">
        {topEntries.map((entry) => (
          <div key={entry.id}>{entry.content}</div>
        ))}
        {bottomEntries.length > 0 ? (
          <div className="mt-auto flex flex-col gap-[var(--shell-rail-gap,1rem)]">
            {bottomEntries.map((entry) => (
              <div key={entry.id}>{entry.content}</div>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  const updateSnapshots = () => {
    contentSnapshot = computeSnapshot()
    const nextPresence = slots.size > 0
    const presenceChanged = nextPresence !== presenceSnapshot
    presenceSnapshot = nextPresence
    notify(contentListeners)
    if (presenceChanged) {
      notify(presenceListeners)
    }
  }

  return {
    getContentSnapshot: () => contentSnapshot,
    getPresenceSnapshot: () => presenceSnapshot,
    subscribeContent: (listener) => {
      contentListeners.add(listener)
      return () => contentListeners.delete(listener)
    },
    subscribePresence: (listener) => {
      presenceListeners.add(listener)
      return () => presenceListeners.delete(listener)
    },
    setSlot: (id, content, priority = 0, align = "top") => {
      if (content == null) {
        if (slots.has(id)) {
          slots.delete(id)
          updateSnapshots()
        }
        return
      }
      const existing = slots.get(id)
      const entry: RightRailSlotEntry = {
        id,
        content,
        priority,
        align,
        order: existing?.order ?? order++,
      }
      slots.set(id, entry)
      updateSnapshots()
    },
    removeSlot: (id) => {
      if (!slots.has(id)) return
      slots.delete(id)
      updateSnapshots()
    },
  }
}

export function RightRailProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<RightRailStore | null>(null)
  if (!storeRef.current) {
    storeRef.current = createRightRailStore()
  }

  return <RightRailContext.Provider value={storeRef.current}>{children}</RightRailContext.Provider>
}

function useRightRailStore() {
  const context = useContext(RightRailContext)
  if (!context) {
    throw new Error("useRightRail must be used within RightRailProvider.")
  }
  return context
}

export function useRightRailContent() {
  const store = useRightRailStore()
  return useSyncExternalStore(
    store.subscribeContent,
    store.getContentSnapshot,
    store.getContentSnapshot,
  )
}

export function useRightRailPresence() {
  const store = useRightRailStore()
  return useSyncExternalStore(
    store.subscribePresence,
    store.getPresenceSnapshot,
    store.getPresenceSnapshot,
  )
}

export function RightRailSlot({
  children,
  priority = 0,
  align = "top",
}: {
  children: ReactNode
  priority?: number
  align?: "top" | "bottom"
}) {
  const store = useRightRailStore()
  const slotId = useId()

  useEffect(() => {
    store.setSlot(slotId, children ?? null, priority, align)
    return () => store.removeSlot(slotId)
  }, [align, children, priority, slotId, store])

  return null
}
