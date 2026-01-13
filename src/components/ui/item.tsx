"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

type ItemProps = React.HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean
}

export const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ className, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"
	    return (
	      <Comp
	        ref={ref as unknown as React.Ref<HTMLDivElement>}
	        className={cn(
	          "group relative w-full rounded-lg border bg-[#FAFAFA] p-3 text-foreground dark:bg-[#151515] sm:p-4",
	          "hover:bg-accent/50 transition-colors",
	          "flex items-center gap-3",
	          className,
	        )}
	        {...props}
      />
    )
  }
)
Item.displayName = "Item"

export const ItemMedia = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("shrink-0", className)} {...props} />
  )
)
ItemMedia.displayName = "ItemMedia"

export const ItemContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("min-w-0 flex-1", className)} {...props} />
  )
)
ItemContent.displayName = "ItemContent"

export const ItemTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-sm font-medium leading-tight truncate", className)} {...props} />
  )
)
ItemTitle.displayName = "ItemTitle"

export const ItemDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-xs text-muted-foreground truncate", className)} {...props} />
  )
)
ItemDescription.displayName = "ItemDescription"

export const ItemActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("ml-auto flex items-center gap-2", className)} {...props} />
  )
)
ItemActions.displayName = "ItemActions"

export const ItemFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mt-2", className)} {...props} />
  )
)
ItemFooter.displayName = "ItemFooter"
