import * as React from "react"

import {
  buildReactGrabDebugSurfaceRecord,
  debugSurfaceClass,
  type ReactGrabDebugSurfaceAttributes,
} from "@/components/dev/react-grab-debug-surface"
import { cn } from "@/lib/utils"

const CARD_SOURCE = "src/components/ui/card.tsx"
const CARD_IMPORT = "@/components/ui/card"

function resolveCardSurfaceClassName({
  props,
  className,
  baseClassName,
  fallbackComponent,
  defaultSlot,
}: {
  props: React.ComponentProps<"div">
  className: string | undefined
  baseClassName: string
  fallbackComponent: string
  defaultSlot: string
}) {
  const resolvedClassName = cn(baseClassName, className)
  const debugRecord = buildReactGrabDebugSurfaceRecord({
    attributes: props as ReactGrabDebugSurfaceAttributes,
    fallbackComponent,
    fallbackSource: CARD_SOURCE,
    defaultSlot,
    defaultSurfaceKind: "root",
    className: resolvedClassName,
    classAssemblyFile: CARD_SOURCE,
    primitiveImport: CARD_IMPORT,
  })

  return debugRecord ? debugSurfaceClass(debugRecord) : resolvedClassName
}

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={resolveCardSurfaceClassName({
        props,
        className,
        baseClassName:
          "bg-card text-card-foreground flex flex-col rounded-xl border shadow-sm",
        fallbackComponent: "Card",
        defaultSlot: "card",
      })}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={resolveCardSurfaceClassName({
        props,
        className,
        baseClassName:
          "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-4 pb-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        fallbackComponent: "CardHeader",
        defaultSlot: "card-header",
      })}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={resolveCardSurfaceClassName({
        props,
        className,
        baseClassName: "px-6 pb-4 first:pt-4",
        fallbackComponent: "CardContent",
        defaultSlot: "card-content",
      })}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 pb-4 pt-0 [.border-t]:pt-4", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
