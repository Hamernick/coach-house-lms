"use client"

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react"

type SidebarSlotStore = {
  getContentSnapshot: () => ReactNode | null
  getPresenceSnapshot: () => boolean
  subscribeContent: (listener: () => void) => () => void
  subscribePresence: (listener: () => void) => () => void
  setContent: (content: ReactNode | null) => void
}

const HomeCanvasSidebarSlotContext = createContext<SidebarSlotStore | null>(null)

function createSidebarSlotStore(): SidebarSlotStore {
  const contentListeners = new Set<() => void>()
  const presenceListeners = new Set<() => void>()
  let contentSnapshot: ReactNode | null = null
  let presenceSnapshot = false

  const notify = (listeners: Set<() => void>) => {
    listeners.forEach((listener) => listener())
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
    setContent: (content) => {
      const nextPresence = content != null
      const presenceChanged = nextPresence !== presenceSnapshot

      contentSnapshot = content
      presenceSnapshot = nextPresence

      notify(contentListeners)
      if (presenceChanged) {
        notify(presenceListeners)
      }
    },
  }
}

function useHomeCanvasSidebarSlotStore() {
  const context = useContext(HomeCanvasSidebarSlotContext)
  if (!context) {
    throw new Error("useHomeCanvasSidebarSlot must be used within HomeCanvasSidebarSlotProvider.")
  }
  return context
}

export function HomeCanvasSidebarSlotProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<SidebarSlotStore | null>(null)
  if (!storeRef.current) {
    storeRef.current = createSidebarSlotStore()
  }

  return (
    <HomeCanvasSidebarSlotContext.Provider value={storeRef.current}>
      {children}
    </HomeCanvasSidebarSlotContext.Provider>
  )
}

export function useHomeCanvasSidebarContent() {
  const store = useHomeCanvasSidebarSlotStore()
  return useSyncExternalStore(
    store.subscribeContent,
    store.getContentSnapshot,
    store.getContentSnapshot,
  )
}

export function useHomeCanvasSidebarPresence() {
  const store = useHomeCanvasSidebarSlotStore()
  return useSyncExternalStore(
    store.subscribePresence,
    store.getPresenceSnapshot,
    store.getPresenceSnapshot,
  )
}

export function HomeCanvasSidebarSlot({ children }: { children: ReactNode }) {
  const store = useHomeCanvasSidebarSlotStore()

  useLayoutEffect(() => {
    store.setContent(children ?? null)
    return () => store.setContent(null)
  }, [children, store])

  return null
}
