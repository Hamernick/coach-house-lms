"use client"

import * as React from "react"

type InputValue = string[] | string

interface VisuallyHiddenInputProps<T = InputValue> extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "checked" | "onReset"
> {
  bubbles?: boolean
  checked?: boolean
  control: HTMLElement | null
  value?: T
}

function VisuallyHiddenInput<T = InputValue>(
  props: VisuallyHiddenInputProps<T>
) {
  const {
    bubbles = true,
    checked,
    control,
    style,
    type = "hidden",
    value,
    ...inputProps
  } = props

  const isCheckInput = React.useMemo(
    () => type === "checkbox" || type === "radio" || type === "switch",
    [type]
  )
  const inputRef = React.useRef<HTMLInputElement>(null)

  const prevValueRef = React.useRef<{
    previous: T | boolean | undefined
    value: T | boolean | undefined
  }>({
    previous: isCheckInput ? checked : value,
    value: isCheckInput ? checked : value,
  })

  const prevValue = React.useMemo(() => {
    const currentValue = isCheckInput ? checked : value
    if (prevValueRef.current.value !== currentValue) {
      prevValueRef.current.previous = prevValueRef.current.value
      prevValueRef.current.value = currentValue
    }
    return prevValueRef.current.previous
  }, [checked, isCheckInput, value])

  const [controlSize, setControlSize] = React.useState<{
    height?: number
    width?: number
  }>({})

  React.useLayoutEffect(() => {
    if (!control) {
      setControlSize({})
      return
    }

    setControlSize({
      height: control.offsetHeight,
      width: control.offsetWidth,
    })

    if (typeof window === "undefined") return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      if ("borderBoxSize" in entry) {
        const borderSizeEntry = entry.borderBoxSize
        const borderSize = Array.isArray(borderSizeEntry)
          ? borderSizeEntry[0]
          : borderSizeEntry
        setControlSize({
          height: borderSize.blockSize,
          width: borderSize.inlineSize,
        })
        return
      }

      setControlSize({
        height: control.offsetHeight,
        width: control.offsetWidth,
      })
    })

    resizeObserver.observe(control, { box: "border-box" })
    return () => {
      resizeObserver.disconnect()
    }
  }, [control])

  React.useEffect(() => {
    const input = inputRef.current
    if (!input) return

    const inputProto = window.HTMLInputElement.prototype
    const propertyKey = isCheckInput ? "checked" : "value"
    const eventType = isCheckInput ? "click" : "input"
    const currentValue = isCheckInput ? checked : value
    const serializedCurrentValue = isCheckInput
      ? checked
      : typeof value === "object" && value !== null
        ? JSON.stringify(value)
        : value
    const setter = Object.getOwnPropertyDescriptor(inputProto, propertyKey)?.set

    if (prevValue !== currentValue && setter) {
      const event = new Event(eventType, { bubbles })
      setter.call(input, serializedCurrentValue)
      input.dispatchEvent(event)
    }
  }, [bubbles, checked, isCheckInput, prevValue, value])

  const composedStyle = React.useMemo<React.CSSProperties>(
    () => ({
      ...style,
      ...(controlSize.width !== undefined && controlSize.height !== undefined
        ? controlSize
        : {}),
      border: 0,
      clip: "rect(0 0 0 0)",
      clipPath: "inset(50%)",
      height: "1px",
      margin: "-1px",
      overflow: "hidden",
      padding: 0,
      position: "absolute",
      whiteSpace: "nowrap",
      width: "1px",
    }),
    [controlSize, style]
  )

  return (
    <input
      type={type}
      {...inputProps}
      ref={inputRef}
      aria-hidden={isCheckInput}
      tabIndex={-1}
      defaultChecked={isCheckInput ? checked : undefined}
      style={composedStyle}
    />
  )
}

export { VisuallyHiddenInput }
