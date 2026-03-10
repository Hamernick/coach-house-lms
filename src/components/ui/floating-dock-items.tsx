"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  type MotionValue,
  motion,
  useSpring,
  useTransform,
} from "motion/react"
import { type ReactNode, useRef } from "react"

import type {
  FloatingDockItem,
  FloatingDockOrientation,
} from "./floating-dock"

function DockTooltip({
  title,
  orientation,
}: {
  title: string
  orientation: FloatingDockOrientation
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-1/2 z-10 w-fit -translate-x-1/2 whitespace-nowrap rounded-md border border-border/70 bg-card px-2 py-0.5 text-[10px] font-medium text-foreground opacity-0 shadow-md transition duration-150 group-hover:opacity-100",
        orientation === "vertical"
          ? "left-full ml-2 top-1/2 -translate-y-1/2 translate-x-0"
          : "-top-8 group-hover:-translate-y-0.5",
      )}
    >
      {title}
    </div>
  )
}

function DockInteractiveElement({
  item,
  children,
}: {
  item: FloatingDockItem
  children: ReactNode
}) {
  const interactiveClassName = cn(
    "touch-manipulation rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-1",
    item.disabled && "cursor-not-allowed",
  )

  if (item.onClick) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={item.disabled}
        className={cn("h-auto w-auto p-0", interactiveClassName)}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          item.onClick?.()
        }}
        aria-label={item.ariaLabel ?? item.title}
        aria-pressed={item.active}
      >
        {children}
      </Button>
    )
  }

  return (
    <a
      href={item.href ?? "#"}
      aria-label={item.ariaLabel ?? item.title}
      aria-disabled={item.disabled ? "true" : undefined}
      className={interactiveClassName}
      onClick={(event) => {
        if (item.disabled) {
          event.preventDefault()
        }
      }}
    >
      {children}
    </a>
  )
}

function DockDesktopCore({
  item,
  orientation,
  container,
  icon,
}: {
  item: FloatingDockItem
  orientation: FloatingDockOrientation
  container: ReactNode
  icon: ReactNode
}) {
  return (
    <div
      className={cn(
        "group relative flex aspect-square items-center justify-center rounded-full border transition-colors duration-150 backdrop-blur-md",
        item.active
          ? "border-neutral-300/80 bg-neutral-100/74 text-neutral-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)] dark:border-neutral-700/75 dark:bg-neutral-900/90 dark:text-neutral-200 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
          : "border-neutral-300/65 bg-neutral-100/58 text-neutral-500 dark:border-neutral-700/70 dark:bg-neutral-900/85 dark:text-neutral-300",
        item.disabled && "opacity-55",
      )}
    >
      <DockTooltip title={item.title} orientation={orientation} />
      {container}
      {icon}
    </div>
  )
}

export function DockMobileAction({
  item,
  onSelect,
}: {
  item: FloatingDockItem
  onSelect: () => void
}) {
  const actionClassName = cn(
    "touch-manipulation flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-150 backdrop-blur-md",
    item.active
      ? "border-neutral-300/80 bg-neutral-100/75 text-neutral-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] dark:border-neutral-700/75 dark:bg-neutral-900/90 dark:text-neutral-200 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
      : "border-neutral-300/65 bg-neutral-100/60 text-neutral-500 dark:border-neutral-700/70 dark:bg-neutral-900/85 dark:text-neutral-300",
    item.disabled && "cursor-not-allowed opacity-55",
  )

  if (item.onClick) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={item.disabled}
        onClick={() => {
          if (item.disabled) return
          item.onClick?.()
          onSelect()
        }}
        className={cn("h-11 w-11", actionClassName)}
        aria-label={item.ariaLabel ?? item.title}
        aria-pressed={item.active}
      >
        <div className="h-4 w-4">{item.icon}</div>
      </Button>
    )
  }

  return (
    <a
      href={item.href ?? "#"}
      aria-label={item.ariaLabel ?? item.title}
      aria-disabled={item.disabled ? "true" : undefined}
      className={actionClassName}
      onClick={(event) => {
        if (item.disabled) {
          event.preventDefault()
          return
        }
        onSelect()
      }}
    >
      <div className="h-4 w-4">{item.icon}</div>
    </a>
  )
}

export function FloatingDockIconStatic({
  item,
  orientation,
  containerBaseSize,
  iconBaseSize,
}: {
  item: FloatingDockItem
  orientation: FloatingDockOrientation
  containerBaseSize: number
  iconBaseSize: number
}) {
  return (
    <DockInteractiveElement item={item}>
      <DockDesktopCore
        item={item}
        orientation={orientation}
        container={
          <div style={{ width: containerBaseSize, height: containerBaseSize }} />
        }
        icon={
          <div
            style={{ width: iconBaseSize, height: iconBaseSize }}
            className="absolute flex items-center justify-center"
          >
            {item.icon}
          </div>
        }
      />
    </DockInteractiveElement>
  )
}

export function FloatingDockIconContainer({
  item,
  pointerAxis,
  orientation,
  interactionRange,
  containerBaseSize,
  containerMaxSize,
  iconBaseSize,
  iconMaxSize,
}: {
  item: FloatingDockItem
  pointerAxis: MotionValue<number>
  orientation: FloatingDockOrientation
  interactionRange: number
  containerBaseSize: number
  containerMaxSize: number
  iconBaseSize: number
  iconMaxSize: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  const distanceFromCenter = useTransform(pointerAxis, (axis) => {
    const bounds = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }
    if (orientation === "vertical") {
      return axis - bounds.y - bounds.height / 2
    }
    return axis - bounds.x - bounds.width / 2
  })

  const widthTransform = useTransform(
    distanceFromCenter,
    [-interactionRange, 0, interactionRange],
    [containerBaseSize, containerMaxSize, containerBaseSize],
  )
  const heightTransform = useTransform(
    distanceFromCenter,
    [-interactionRange, 0, interactionRange],
    [containerBaseSize, containerMaxSize, containerBaseSize],
  )
  const widthTransformIcon = useTransform(
    distanceFromCenter,
    [-interactionRange, 0, interactionRange],
    [iconBaseSize, iconMaxSize, iconBaseSize],
  )
  const heightTransformIcon = useTransform(
    distanceFromCenter,
    [-interactionRange, 0, interactionRange],
    [iconBaseSize, iconMaxSize, iconBaseSize],
  )

  const width = useSpring(widthTransform, {
    mass: 0.12,
    stiffness: 165,
    damping: 14,
  })
  const height = useSpring(heightTransform, {
    mass: 0.12,
    stiffness: 165,
    damping: 14,
  })
  const widthIcon = useSpring(widthTransformIcon, {
    mass: 0.12,
    stiffness: 165,
    damping: 14,
  })
  const heightIcon = useSpring(heightTransformIcon, {
    mass: 0.12,
    stiffness: 165,
    damping: 14,
  })

  return (
    <DockInteractiveElement item={item}>
      <motion.div ref={ref} style={{ width, height }}>
        <DockDesktopCore
          item={item}
          orientation={orientation}
          container={null}
          icon={
            <motion.div
              style={{ width: widthIcon, height: heightIcon }}
              className="flex items-center justify-center"
            >
              {item.icon}
            </motion.div>
          }
        />
      </motion.div>
    </DockInteractiveElement>
  )
}
