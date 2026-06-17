"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react"

export type AppShellAccountMenuActionVisibility = "all" | "platform-admin"

export type AppShellAccountMenuAction = {
  id: string
  label: string
  icon?: ComponentType<{ className?: string; "aria-hidden"?: true }>
  onSelect: () => void
  priority?: number
  visibility?: AppShellAccountMenuActionVisibility
}

type AppShellAccountMenuActionsContextValue = {
  actions: AppShellAccountMenuAction[]
  registerAction: (action: AppShellAccountMenuAction) => () => void
}

const AppShellAccountMenuActionsContext =
  createContext<AppShellAccountMenuActionsContextValue | null>(null)

export function resolveAppShellAccountMenuActionsForUser({
  actions,
  isAdmin,
}: {
  actions: readonly AppShellAccountMenuAction[]
  isAdmin: boolean
}) {
  return actions.filter(
    (action) => action.visibility !== "platform-admin" || isAdmin
  )
}

export function AppShellAccountMenuActionsProvider({
  children,
}: {
  children: ReactNode
}) {
  const [actionsById, setActionsById] = useState<
    Record<string, AppShellAccountMenuAction>
  >({})
  const registerAction = useCallback((action: AppShellAccountMenuAction) => {
    setActionsById((previous) => ({
      ...previous,
      [action.id]: action,
    }))

    return () => {
      setActionsById((previous) => {
        if (!(action.id in previous)) return previous
        const next = { ...previous }
        delete next[action.id]
        return next
      })
    }
  }, [])
  const actions = useMemo(
    () =>
      Object.values(actionsById).sort((first, second) => {
        const priorityDelta = (first.priority ?? 0) - (second.priority ?? 0)
        if (priorityDelta !== 0) return priorityDelta
        return first.label.localeCompare(second.label)
      }),
    [actionsById]
  )
  const value = useMemo(
    () => ({
      actions,
      registerAction,
    }),
    [actions, registerAction]
  )

  return (
    <AppShellAccountMenuActionsContext.Provider value={value}>
      {children}
    </AppShellAccountMenuActionsContext.Provider>
  )
}

export function useAppShellAccountMenuActions() {
  return useContext(AppShellAccountMenuActionsContext)?.actions ?? []
}

export function useRegisterAppShellAccountMenuAction(
  action: AppShellAccountMenuAction | null
) {
  const registerAction = useContext(AppShellAccountMenuActionsContext)
    ?.registerAction

  useEffect(() => {
    if (!action || !registerAction) return
    return registerAction(action)
  }, [action, registerAction])
}
