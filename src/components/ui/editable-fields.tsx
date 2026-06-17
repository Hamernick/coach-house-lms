"use client"

import { Slot as SlotPrimitive } from "radix-ui"
import * as React from "react"

import { useComposedRefs } from "@/lib/compose-refs"
import { useAsRef } from "@/lib/use-as-ref"
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect"
import { cn } from "@/lib/utils"

import {
  AREA_NAME,
  INPUT_NAME,
  LABEL_NAME,
  PREVIEW_NAME,
  useEditableContext,
  useStore,
  useStoreContext,
} from "./editable-context"

type PreviewElement = React.ComponentRef<typeof EditablePreview>
type InputElement = React.ComponentRef<typeof EditableInput>

interface EditableLabelProps extends React.ComponentProps<"label"> {
  asChild?: boolean
}

function EditableLabel(props: EditableLabelProps) {
  const { asChild, className, children, ref, ...labelProps } = props
  const context = useEditableContext(LABEL_NAME)

  const LabelPrimitive = asChild ? SlotPrimitive.Slot : "label"

  return (
    <LabelPrimitive
      data-disabled={context.disabled ? "" : undefined}
      data-invalid={context.invalid ? "" : undefined}
      data-required={context.required ? "" : undefined}
      data-slot="editable-label"
      {...labelProps}
      ref={ref}
      id={context.labelId}
      htmlFor={context.inputId}
      className={cn(
        "data-required:after:text-destructive text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-required:after:ml-0.5 data-required:after:content-['*']",
        className
      )}
    >
      {children}
    </LabelPrimitive>
  )
}

interface EditableAreaProps extends React.ComponentProps<"div"> {
  asChild?: boolean
}

function EditableArea(props: EditableAreaProps) {
  const { asChild, className, ref, ...areaProps } = props
  const context = useEditableContext(AREA_NAME)
  const editing = useStore((state) => state.editing)

  const AreaPrimitive = asChild ? SlotPrimitive.Slot : "div"

  return (
    <AreaPrimitive
      role="group"
      data-disabled={context.disabled ? "" : undefined}
      data-editing={editing ? "" : undefined}
      data-slot="editable-area"
      dir={context.dir}
      {...areaProps}
      ref={ref}
      className={cn(
        "relative inline-block min-w-0 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
    />
  )
}

interface EditablePreviewProps extends React.ComponentProps<"div"> {
  asChild?: boolean
}

function EditablePreview(props: EditablePreviewProps) {
  const {
    onClick: onClickProp,
    onDoubleClick: onDoubleClickProp,
    onFocus: onFocusProp,
    onKeyDown: onKeyDownProp,
    asChild,
    className,
    ref,
    ...previewProps
  } = props

  const context = useEditableContext(PREVIEW_NAME)
  const value = useStore((state) => state.value)
  const editing = useStore((state) => state.editing)

  const propsRef = useAsRef({
    onClick: onClickProp,
    onDoubleClick: onDoubleClickProp,
    onFocus: onFocusProp,
    onKeyDown: onKeyDownProp,
  })

  const onTrigger = React.useCallback(() => {
    if (context.disabled || context.readOnly) return
    context.onEdit()
  }, [context])

  const onClick = React.useCallback(
    (event: React.MouseEvent<PreviewElement>) => {
      propsRef.current.onClick?.(event)
      if (event.defaultPrevented || context.triggerMode !== "click") return

      onTrigger()
    },
    [propsRef, onTrigger, context.triggerMode]
  )

  const onDoubleClick = React.useCallback(
    (event: React.MouseEvent<PreviewElement>) => {
      propsRef.current.onDoubleClick?.(event)
      if (event.defaultPrevented || context.triggerMode !== "dblclick") return

      onTrigger()
    },
    [propsRef, onTrigger, context.triggerMode]
  )

  const onFocus = React.useCallback(
    (event: React.FocusEvent<PreviewElement>) => {
      propsRef.current.onFocus?.(event)
      if (event.defaultPrevented || context.triggerMode !== "focus") return

      onTrigger()
    },
    [propsRef, onTrigger, context.triggerMode]
  )

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<PreviewElement>) => {
      propsRef.current.onKeyDown?.(event)
      if (event.defaultPrevented) return

      if (event.key === "Enter") {
        const nativeEvent = event.nativeEvent
        if (context.onEnterKeyDown) {
          context.onEnterKeyDown(nativeEvent)
          if (nativeEvent.defaultPrevented) return
        }
        onTrigger()
      }
    },
    [propsRef, onTrigger, context]
  )

  const PreviewPrimitive = asChild ? SlotPrimitive.Slot : "div"

  if (editing || context.readOnly) return null

  return (
    <PreviewPrimitive
      role="button"
      aria-disabled={context.disabled || context.readOnly}
      data-empty={!value ? "" : undefined}
      data-disabled={context.disabled ? "" : undefined}
      data-readonly={context.readOnly ? "" : undefined}
      data-slot="editable-preview"
      tabIndex={context.disabled || context.readOnly ? undefined : 0}
      {...previewProps}
      ref={ref}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      className={cn(
        "focus-visible:ring-ring data-empty:text-muted-foreground cursor-text truncate rounded-sm border border-transparent py-1 text-base focus-visible:ring-1 focus-visible:outline-hidden data-disabled:cursor-not-allowed data-disabled:opacity-50 data-readonly:cursor-default md:text-sm",
        className
      )}
    >
      {value || context.placeholder}
    </PreviewPrimitive>
  )
}

interface EditableInputProps extends React.ComponentProps<"input"> {
  asChild?: boolean
  maxLength?: number
}

function EditableInput(props: EditableInputProps) {
  const {
    onBlur: onBlurProp,
    onChange: onChangeProp,
    onKeyDown: onKeyDownProp,
    asChild,
    className,
    disabled,
    readOnly,
    required,
    maxLength,
    ref,
    ...inputProps
  } = props

  const context = useEditableContext(INPUT_NAME)
  const store = useStoreContext(INPUT_NAME)
  const value = useStore((state) => state.value)
  const editing = useStore((state) => state.editing)
  const inputRef = React.useRef<InputElement>(null)
  const composedRef = useComposedRefs(ref, inputRef)

  const propsRef = useAsRef({
    onBlur: onBlurProp,
    onChange: onChangeProp,
    onKeyDown: onKeyDownProp,
  })

  const isDisabled = disabled || context.disabled
  const isReadOnly = readOnly || context.readOnly
  const isRequired = required || context.required

  const onAutosize = React.useCallback(
    (target: InputElement) => {
      if (!context.autosize) return

      if (target instanceof HTMLTextAreaElement) {
        target.style.height = "0"
        target.style.height = `${target.scrollHeight}px`
      } else {
        target.style.width = "0"
        target.style.width = `${target.scrollWidth + 4}px`
      }
    },
    [context.autosize]
  )

  const onBlur = React.useCallback(
    (event: React.FocusEvent<InputElement>) => {
      if (isDisabled || isReadOnly) return

      propsRef.current.onBlur?.(event)
      if (event.defaultPrevented) return

      const relatedTarget = event.relatedTarget

      const isAction =
        relatedTarget instanceof HTMLElement &&
        (relatedTarget.closest(`[data-slot="editable-trigger"]`) ||
          relatedTarget.closest(`[data-slot="editable-cancel"]`))

      if (!isAction) {
        context.onSubmit(value)
      }
    },
    [value, context, propsRef, isDisabled, isReadOnly]
  )

  const onChange = React.useCallback(
    (event: React.ChangeEvent<InputElement>) => {
      if (isDisabled || isReadOnly) return

      propsRef.current.onChange?.(event)
      if (event.defaultPrevented) return

      store.setState("value", event.target.value)
      onAutosize(event.target)
    },
    [store, propsRef, onAutosize, isDisabled, isReadOnly]
  )

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<InputElement>) => {
      if (isDisabled || isReadOnly) return

      propsRef.current.onKeyDown?.(event)
      if (event.defaultPrevented) return

      if (event.key === "Escape") {
        const nativeEvent = event.nativeEvent
        if (context.onEscapeKeyDown) {
          context.onEscapeKeyDown(nativeEvent)
          if (nativeEvent.defaultPrevented) return
        }
        context.onCancel()
      } else if (event.key === "Enter") {
        context.onSubmit(value)
      }
    },
    [value, context, propsRef, isDisabled, isReadOnly]
  )

  useIsomorphicLayoutEffect(() => {
    if (!editing || isDisabled || isReadOnly || !inputRef.current) return

    const frameId = window.requestAnimationFrame(() => {
      if (!inputRef.current) return

      inputRef.current.focus()
      inputRef.current.select()
      onAutosize(inputRef.current)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [editing, onAutosize, isDisabled, isReadOnly])

  const InputPrimitive = asChild ? SlotPrimitive.Slot : "input"

  if (!editing && !isReadOnly) return null

  return (
    <InputPrimitive
      aria-required={isRequired}
      aria-invalid={context.invalid}
      data-slot="editable-input"
      dir={context.dir}
      disabled={isDisabled}
      readOnly={isReadOnly}
      required={isRequired}
      {...inputProps}
      id={context.inputId}
      aria-labelledby={context.labelId}
      ref={composedRef}
      maxLength={maxLength}
      placeholder={context.placeholder}
      value={value}
      onBlur={onBlur}
      onChange={onChange}
      onKeyDown={onKeyDown}
      className={cn(
        "border-input file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex rounded-sm border bg-transparent py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        context.autosize ? "w-auto" : "w-full",
        className
      )}
    />
  )
}

export {
  EditableArea,
  EditableInput,
  EditableLabel,
  EditablePreview,
  type EditableInputProps,
  type EditableLabelProps,
  type EditablePreviewProps,
}
