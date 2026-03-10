"use client"
/**
 * Note: Use position fixed according to your needs.
 * Desktop dock is better positioned at the bottom.
 * Mobile dock is better positioned at the bottom right.
 **/

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { IconLayoutNavbarCollapse } from "@tabler/icons-react"
import {
  AnimatePresence,
  motion,
  useMotionValue,
} from "motion/react"
import { type ReactNode, useState } from "react"

import {
  DockMobileAction,
  FloatingDockIconContainer,
  FloatingDockIconStatic,
} from "./floating-dock-items"

export type FloatingDockOrientation = "horizontal" | "vertical"

export type FloatingDockItem = {
  id: string
  title: string
  icon: ReactNode
  href?: string
  onClick?: () => void
  ariaLabel?: string
  disabled?: boolean
  active?: boolean
}

export function FloatingDock({
  items,
  desktopClassName,
  mobileClassName,
  orientation = "horizontal",
  showMobile = true,
  magnify = true,
  interactionRange = 150,
  containerBaseSize = 40,
  containerMaxSize = 80,
  iconBaseSize = 20,
  iconMaxSize = 40,
}: {
  items: FloatingDockItem[]
  desktopClassName?: string
  mobileClassName?: string
  orientation?: FloatingDockOrientation
  showMobile?: boolean
  magnify?: boolean
  interactionRange?: number
  containerBaseSize?: number
  containerMaxSize?: number
  iconBaseSize?: number
  iconMaxSize?: number
}) {
  return (
    <>
      <FloatingDockDesktop
        items={items}
        className={desktopClassName}
        orientation={orientation}
        magnify={magnify}
        interactionRange={interactionRange}
        containerBaseSize={containerBaseSize}
        containerMaxSize={containerMaxSize}
        iconBaseSize={iconBaseSize}
        iconMaxSize={iconMaxSize}
      />
      {showMobile ? <FloatingDockMobile items={items} className={mobileClassName} /> : null}
    </>
  )
}

function FloatingDockMobile({
  items,
  className,
}: {
  items: FloatingDockItem[]
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open ? (
          <motion.div
            layoutId="floating-dock-nav"
            className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-2"
          >
            {items.map((item, index) => (
              <motion.div
                key={`mobile-${item.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  y: 10,
                  transition: {
                    delay: index * 0.05,
                  },
                }}
                transition={{ delay: (items.length - 1 - index) * 0.05 }}
              >
                <DockMobileAction item={item} onSelect={() => setOpen(false)} />
              </motion.div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen((current) => !current)}
        className="touch-manipulation h-11 w-11 rounded-full border border-neutral-300/70 bg-neutral-100/80 text-neutral-600 shadow-md backdrop-blur-md dark:border-neutral-700/70 dark:bg-neutral-900/90 dark:text-neutral-300"
        aria-label={open ? "Close dock navigation" : "Open dock navigation"}
        aria-expanded={open}
      >
        <IconLayoutNavbarCollapse className="h-5 w-5" aria-hidden />
      </Button>
    </div>
  )
}

function FloatingDockDesktop({
  items,
  className,
  orientation,
  magnify,
  interactionRange,
  containerBaseSize,
  containerMaxSize,
  iconBaseSize,
  iconMaxSize,
}: {
  items: FloatingDockItem[]
  className?: string
  orientation: FloatingDockOrientation
  magnify: boolean
  interactionRange: number
  containerBaseSize: number
  containerMaxSize: number
  iconBaseSize: number
  iconMaxSize: number
}) {
  const pointerAxis = useMotionValue(Infinity)

  return (
    <motion.div
      onMouseMove={
        magnify
          ? (event) =>
              pointerAxis.set(orientation === "vertical" ? event.pageY : event.pageX)
          : undefined
      }
      onMouseLeave={magnify ? () => pointerAxis.set(Infinity) : undefined}
      className={cn(
        "supports-backdrop-blur:bg-neutral-100/72 hidden w-max rounded-2xl border border-neutral-300/65 shadow-lg backdrop-blur-xl md:flex dark:border-neutral-700/70 dark:bg-neutral-900/86",
        orientation === "horizontal"
          ? "mx-auto h-16 flex-row items-end gap-4 px-4 pb-3"
          : "min-w-[3.5rem] flex-col items-center gap-3 px-2.5 py-3",
        className,
      )}
    >
      {magnify
        ? items.map((item) => (
            <FloatingDockIconContainer
              key={`desktop-${item.id}`}
              item={item}
              pointerAxis={pointerAxis}
              orientation={orientation}
              interactionRange={interactionRange}
              containerBaseSize={containerBaseSize}
              containerMaxSize={containerMaxSize}
              iconBaseSize={iconBaseSize}
              iconMaxSize={iconMaxSize}
            />
          ))
        : items.map((item) => (
            <FloatingDockIconStatic
              key={`desktop-${item.id}`}
              item={item}
              orientation={orientation}
              containerBaseSize={containerBaseSize}
              iconBaseSize={iconBaseSize}
            />
      ))}
    </motion.div>
  )
}
