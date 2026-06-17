"use client"

import * as React from "react"

export const ROOT_NAME = "Editable"
export const LABEL_NAME = "EditableLabel"
export const AREA_NAME = "EditableArea"
export const PREVIEW_NAME = "EditablePreview"
export const INPUT_NAME = "EditableInput"
export const TRIGGER_NAME = "EditableTrigger"
export const TOOLBAR_NAME = "EditableToolbar"
export const CANCEL_NAME = "EditableCancel"
export const SUBMIT_NAME = "EditableSubmit"

export type Direction = "ltr" | "rtl"

export interface DivProps extends React.ComponentProps<"div"> {
  asChild?: boolean
}

export interface StoreState {
  value: string
  editing: boolean
}

export interface Store {
  subscribe: (callback: () => void) => () => void
  getState: () => StoreState
  setState: <K extends keyof StoreState>(key: K, value: StoreState[K]) => void
  notify: () => void
}

export const StoreContext = React.createContext<Store | null>(null)

export function useStoreContext(consumerName: string) {
  const context = React.useContext(StoreContext)
  if (!context) {
    throw new Error(`\`${consumerName}\` must be used within \`${ROOT_NAME}\``)
  }
  return context
}

export function useStore<T>(
  selector: (state: StoreState) => T,
  ogStore?: Store | null
): T {
  const contextStore = React.useContext(StoreContext)
  const store = ogStore ?? contextStore

  if (!store) {
    throw new Error(`\`useStore\` must be used within \`${ROOT_NAME}\``)
  }

  const getSnapshot = React.useCallback(
    () => selector(store.getState()),
    [store, selector]
  )

  return React.useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot)
}

export interface EditableContextValue {
  rootId: string
  inputId: string
  labelId: string
  defaultValue: string
  onCancel: () => void
  onEdit: () => void
  onSubmit: (value: string) => void
  onEnterKeyDown?: (event: KeyboardEvent) => void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  dir?: Direction
  maxLength?: number
  placeholder?: string
  triggerMode: "click" | "dblclick" | "focus"
  autosize: boolean
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
}

export const EditableContext = React.createContext<EditableContextValue | null>(
  null
)

export function useEditableContext(consumerName: string) {
  const context = React.useContext(EditableContext)
  if (!context) {
    throw new Error(`\`${consumerName}\` must be used within \`${ROOT_NAME}\``)
  }
  return context
}
