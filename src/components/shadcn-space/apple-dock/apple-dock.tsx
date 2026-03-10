"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { motion, type MotionProps, type MotionValue, useMotionValue, useSpring, useTransform } from "motion/react"
import {
  Children,
  cloneElement,
  isValidElement,
  type HTMLAttributes,
  type MouseEvent,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
  useRef,
} from "react"

import { cn } from "@/lib/utils"

type AppleDockOrientation = "horizontal" | "vertical"

const DEFAULT_SIZE = 40
const DEFAULT_MAGNIFICATION = 58
const DEFAULT_DISTANCE = 140

const appleDockVariants = cva(
  [
    "supports-backdrop-blur:bg-background/72 border-border/60 flex w-max rounded-[20px] border p-2 shadow-lg backdrop-blur-lg",
  ],
  {
    variants: {
      orientation: {
        horizontal: "h-[58px] flex-row items-center gap-2",
        vertical: "w-[58px] flex-col items-center gap-2",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  },
)

export interface AppleDockProps extends VariantProps<typeof appleDockVariants> {
  className?: string
  children: ReactNode
  iconSize?: number
  iconMagnification?: number
  iconDistance?: number
  disableMagnification?: boolean
}

export function AppleDock({
  className,
  children,
  orientation = "horizontal",
  iconSize = DEFAULT_SIZE,
  iconMagnification = DEFAULT_MAGNIFICATION,
  iconDistance = DEFAULT_DISTANCE,
  disableMagnification = false,
}: AppleDockProps) {
  const resolvedOrientation: AppleDockOrientation = orientation ?? "horizontal"
  const pointer = useMotionValue(Infinity)

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    pointer.set(resolvedOrientation === "vertical" ? event.pageY : event.pageX)
  }

  return (
    <motion.div
      onMouseMove={handleMove}
      onMouseLeave={() => pointer.set(Infinity)}
      className={cn(appleDockVariants({ orientation: resolvedOrientation }), className)}
    >
      {childrenWithDockProps(children, {
        pointer,
        orientation: resolvedOrientation,
        size: iconSize,
        magnification: iconMagnification,
        distance: iconDistance,
        disableMagnification,
      })}
    </motion.div>
  )
}

type AppleDockItemPassThroughProps = Pick<
  AppleDockItemProps,
  "pointer" | "orientation" | "size" | "magnification" | "distance" | "disableMagnification"
>

function childrenWithDockProps(children: ReactNode, dockProps: AppleDockItemPassThroughProps) {
  return Children.map(children, (child) => cloneDockItem(child, dockProps))
}

function cloneDockItem(child: ReactNode, dockProps: AppleDockItemPassThroughProps) {
  if (!isAppleDockItemElement(child)) return child
  return cloneElement(child, {
    ...child.props,
    ...dockProps,
  })
}

function isAppleDockItemElement(value: ReactNode): value is ReactElement<AppleDockItemProps, typeof AppleDockItem> {
  return isValidElement(value) && value.type === AppleDockItem
}

export interface AppleDockItemProps
  extends Omit<MotionProps & HTMLAttributes<HTMLDivElement>, "children">,
    PropsWithChildren {
  className?: string
  pointer?: MotionValue<number>
  orientation?: AppleDockOrientation
  size?: number
  magnification?: number
  distance?: number
  disableMagnification?: boolean
}

export function AppleDockItem({
  className,
  children,
  pointer,
  orientation = "horizontal",
  size = DEFAULT_SIZE,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  disableMagnification = false,
  ...props
}: AppleDockItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const defaultPointer = useMotionValue(Infinity)

  const distanceFromCenter = useTransform(pointer ?? defaultPointer, (value) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, y: 0, width: 0, height: 0 }
    if (orientation === "vertical") {
      return value - bounds.y - bounds.height / 2
    }
    return value - bounds.x - bounds.width / 2
  })

  const targetSize = disableMagnification ? size : magnification
  const sizeTransform = useTransform(
    distanceFromCenter,
    [-distance, 0, distance],
    [size, targetSize, size],
  )
  const animatedSize = useSpring(sizeTransform, {
    mass: 0.1,
    stiffness: 170,
    damping: 14,
  })

  const padding = Math.max(6, size * 0.2)

  return (
    <motion.div
      ref={ref}
      style={{ width: animatedSize, height: animatedSize, padding }}
      className={cn("flex aspect-square items-center justify-center rounded-full", className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
