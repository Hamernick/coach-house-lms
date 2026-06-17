"use client"

import {
  Direction as DirectionPrimitive,
  Slot as SlotPrimitive,
} from "radix-ui"
import * as React from "react"

import { VisuallyHiddenInput } from "@/components/ui/visually-hidden-input"
import { useComposedRefs } from "@/lib/compose-refs"
import { useAsRef } from "@/lib/use-as-ref"
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect"
import { useLazyRef } from "@/lib/use-lazy-ref"
import { cn } from "@/lib/utils"

import {
  EditableContext,
  StoreContext,
  type Direction,
  type DivProps,
  type EditableContextValue,
  type Store,
  type StoreState,
  useStore,
} from "./editable-context"
import {
  EditableCancel,
  EditableSubmit,
  EditableToolbar,
  EditableTrigger,
} from "./editable-actions"
import {
  EditableArea,
  EditableInput,
  EditableLabel,
  EditablePreview,
} from "./editable-fields"

type RootElement = React.ComponentRef<typeof Editable>

interface EditableProps extends Omit<DivProps, "onSubmit"> {
  id?: string
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  defaultEditing?: boolean
  editing?: boolean
  onEditingChange?: (editing: boolean) => void
  onCancel?: () => void
  onEdit?: () => void
  onSubmit?: (value: string) => void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onEnterKeyDown?: (event: KeyboardEvent) => void
  dir?: Direction
  maxLength?: number
  name?: string
  placeholder?: string
  triggerMode?: EditableContextValue["triggerMode"]
  autosize?: boolean
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
}

function Editable(props: EditableProps) {
  const {
    value: valueProp,
    defaultValue = "",
    defaultEditing,
    editing: editingProp,
    onValueChange,
    onEditingChange,
    onCancel: onCancelProp,
    onEdit: onEditProp,
    onSubmit: onSubmitProp,
    onEscapeKeyDown,
    onEnterKeyDown,
    dir: dirProp,
    maxLength,
    name,
    placeholder,
    triggerMode = "click",
    asChild,
    autosize = false,
    disabled,
    required,
    readOnly,
    invalid,
    className,
    id,
    ref,
    ...rootProps
  } = props

  const instanceId = React.useId()
  const rootId = id ?? instanceId
  const inputId = React.useId()
  const labelId = React.useId()
  const dir = DirectionPrimitive.useDirection(dirProp)
  const previousValueRef = React.useRef(defaultValue)
  const [formTrigger, setFormTrigger] = React.useState<RootElement | null>(null)
  const composedRef = useComposedRefs(ref, (node) => setFormTrigger(node))
  const isFormControl = formTrigger ? !!formTrigger.closest("form") : true

  const listenersRef = useLazyRef(() => new Set<() => void>())
  const stateRef = useLazyRef<StoreState>(() => ({
    value: valueProp ?? defaultValue,
    editing: editingProp ?? defaultEditing ?? false,
  }))

  const propsRef = useAsRef({
    onValueChange,
    onEditingChange,
    onCancel: onCancelProp,
    onEdit: onEditProp,
    onSubmit: onSubmitProp,
    onEscapeKeyDown,
    onEnterKeyDown,
  })

  const store = React.useMemo<Store>(() => {
    return {
      subscribe: (cb) => {
        listenersRef.current.add(cb)
        return () => listenersRef.current.delete(cb)
      },
      getState: () => stateRef.current,
      setState: (key, value) => {
        if (Object.is(stateRef.current[key], value)) return

        if (key === "value" && typeof value === "string") {
          stateRef.current.value = value
          propsRef.current.onValueChange?.(value)
        } else if (key === "editing" && typeof value === "boolean") {
          stateRef.current.editing = value
          propsRef.current.onEditingChange?.(value)
        } else {
          stateRef.current[key] = value
        }

        store.notify()
      },
      notify: () => {
        for (const cb of listenersRef.current) {
          cb()
        }
      },
    }
  }, [listenersRef, stateRef, propsRef])

  const value = useStore((state) => state.value, store)

  useIsomorphicLayoutEffect(() => {
    if (valueProp !== undefined) {
      store.setState("value", valueProp)
    }
  }, [valueProp])

  useIsomorphicLayoutEffect(() => {
    if (editingProp !== undefined) {
      store.setState("editing", editingProp)
    }
  }, [editingProp])

  const onCancel = React.useCallback(() => {
    const prevValue = previousValueRef.current
    store.setState("value", prevValue)
    store.setState("editing", false)
    propsRef.current.onCancel?.()
  }, [store, propsRef])

  const onEdit = React.useCallback(() => {
    const currentValue = store.getState().value
    previousValueRef.current = currentValue
    store.setState("editing", true)
    propsRef.current.onEdit?.()
  }, [store, propsRef])

  const onSubmit = React.useCallback(
    (newValue: string) => {
      store.setState("value", newValue)
      store.setState("editing", false)
      propsRef.current.onSubmit?.(newValue)
    },
    [store, propsRef]
  )

  const contextValue = React.useMemo<EditableContextValue>(
    () => ({
      rootId,
      inputId,
      labelId,
      defaultValue,
      onSubmit,
      onEdit,
      onCancel,
      onEscapeKeyDown,
      onEnterKeyDown,
      dir,
      maxLength,
      placeholder,
      triggerMode,
      autosize,
      disabled,
      readOnly,
      required,
      invalid,
    }),
    [
      rootId,
      inputId,
      labelId,
      defaultValue,
      onSubmit,
      onCancel,
      onEdit,
      onEscapeKeyDown,
      onEnterKeyDown,
      dir,
      maxLength,
      placeholder,
      triggerMode,
      autosize,
      disabled,
      required,
      readOnly,
      invalid,
    ]
  )

  const RootPrimitive = asChild ? SlotPrimitive.Slot : "div"

  return (
    <StoreContext.Provider value={store}>
      <EditableContext.Provider value={contextValue}>
        <RootPrimitive
          data-slot="editable"
          {...rootProps}
          id={id}
          ref={composedRef}
          className={cn("flex min-w-0 flex-col gap-2", className)}
        />
        {isFormControl && (
          <VisuallyHiddenInput
            type="hidden"
            control={formTrigger}
            name={name}
            value={value}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
          />
        )}
      </EditableContext.Provider>
    </StoreContext.Provider>
  )
}

export {
  Editable,
  EditableArea,
  EditableCancel,
  EditableInput,
  EditableLabel,
  EditablePreview,
  type EditableProps,
  EditableSubmit,
  EditableToolbar,
  EditableTrigger,
  useStore as useEditable,
}
