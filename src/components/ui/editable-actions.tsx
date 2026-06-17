"use client"

import { Slot as SlotPrimitive } from "radix-ui"
import * as React from "react"

import { useAsRef } from "@/lib/use-as-ref"
import { cn } from "@/lib/utils"

import {
  CANCEL_NAME,
  SUBMIT_NAME,
  TOOLBAR_NAME,
  TRIGGER_NAME,
  useEditableContext,
  useStore,
} from "./editable-context"

type SubmitElement = React.ComponentRef<typeof EditableSubmit>

interface EditableTriggerProps extends React.ComponentProps<"button"> {
  asChild?: boolean
  forceMount?: boolean
}

function EditableTrigger(props: EditableTriggerProps) {
  const { asChild, forceMount = false, ref, ...triggerProps } = props
  const context = useEditableContext(TRIGGER_NAME)
  const editing = useStore((state) => state.editing)

  const onTrigger = React.useCallback(() => {
    if (context.disabled || context.readOnly) return
    context.onEdit()
  }, [context])

  const TriggerPrimitive = asChild ? SlotPrimitive.Slot : "button"

  if (!forceMount && (editing || context.readOnly)) return null

  return (
    <TriggerPrimitive
      type="button"
      aria-controls={context.rootId}
      aria-disabled={context.disabled || context.readOnly}
      data-disabled={context.disabled ? "" : undefined}
      data-readonly={context.readOnly ? "" : undefined}
      data-slot="editable-trigger"
      {...triggerProps}
      ref={ref}
      onClick={context.triggerMode === "click" ? onTrigger : undefined}
      onDoubleClick={context.triggerMode === "dblclick" ? onTrigger : undefined}
    />
  )
}

interface EditableToolbarProps extends React.ComponentProps<"div"> {
  asChild?: boolean
  orientation?: "horizontal" | "vertical"
}

function EditableToolbar(props: EditableToolbarProps) {
  const {
    asChild,
    className,
    orientation = "horizontal",
    ref,
    ...toolbarProps
  } = props
  const context = useEditableContext(TOOLBAR_NAME)

  const ToolbarPrimitive = asChild ? SlotPrimitive.Slot : "div"

  return (
    <ToolbarPrimitive
      role="toolbar"
      aria-controls={context.rootId}
      aria-orientation={orientation}
      data-slot="editable-toolbar"
      dir={context.dir}
      {...toolbarProps}
      ref={ref}
      className={cn(
        "flex items-center gap-2",
        orientation === "vertical" && "flex-col",
        className
      )}
    />
  )
}

interface EditableCancelProps extends React.ComponentProps<"button"> {
  asChild?: boolean
}

function EditableCancel(props: EditableCancelProps) {
  const { onClick: onClickProp, asChild, ref, ...cancelProps } = props
  const context = useEditableContext(CANCEL_NAME)
  const editing = useStore((state) => state.editing)

  const propsRef = useAsRef({
    onClick: onClickProp,
  })

  const onClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (context.disabled || context.readOnly) return

      propsRef.current.onClick?.(event)
      if (event.defaultPrevented) return

      context.onCancel()
    },
    [propsRef, context]
  )

  const CancelPrimitive = asChild ? SlotPrimitive.Slot : "button"

  if (!editing && !context.readOnly) return null

  return (
    <CancelPrimitive
      type="button"
      aria-controls={context.rootId}
      data-slot="editable-cancel"
      {...cancelProps}
      onClick={onClick}
      ref={ref}
    />
  )
}

interface EditableSubmitProps extends React.ComponentProps<"button"> {
  asChild?: boolean
}

function EditableSubmit(props: EditableSubmitProps) {
  const { onClick: onClickProp, asChild, ref, ...submitProps } = props
  const context = useEditableContext(SUBMIT_NAME)
  const value = useStore((state) => state.value)
  const editing = useStore((state) => state.editing)

  const propsRef = useAsRef({
    onClick: onClickProp,
  })

  const onClick = React.useCallback(
    (event: React.MouseEvent<SubmitElement>) => {
      if (context.disabled || context.readOnly) return

      propsRef.current.onClick?.(event)
      if (event.defaultPrevented) return

      context.onSubmit(value)
    },
    [propsRef, context, value]
  )

  const SubmitPrimitive = asChild ? SlotPrimitive.Slot : "button"

  if (!editing && !context.readOnly) return null

  return (
    <SubmitPrimitive
      type="button"
      aria-controls={context.rootId}
      data-slot="editable-submit"
      {...submitProps}
      ref={ref}
      onClick={onClick}
    />
  )
}

export {
  EditableCancel,
  EditableSubmit,
  EditableToolbar,
  EditableTrigger,
  type EditableCancelProps,
  type EditableSubmitProps,
  type EditableToolbarProps,
  type EditableTriggerProps,
}
