"use client"

import Link from "next/link"
import type { CSSProperties } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMobileNavigationScroll } from "../hooks/use-mobile-navigation-scroll"
import type { MobileNavigationItem } from "../types"
import styles from "./mobile-navigation.module.css"

export function MobileNavigationPanel({
  items,
}: {
  items: MobileNavigationItem[]
}) {
  const keyboardOpen = useMobileNavigationScroll()
  const selected = items.findIndex((item) => item.active)

  return (
    <div className={cn(styles.dock, "md:hidden")} hidden={keyboardOpen}>
      <nav
        aria-label="Main navigation"
        className={styles.bar}
        style={
          {
            "--tab-count": items.length,
            "--active-index": Math.max(0, selected),
          } as CSSProperties
        }
      >
        <span
          className={styles.highlight}
          data-visible={selected >= 0}
          aria-hidden
        />
        {items.map((item, index) => {
          const Icon = item.icon
          const contents = (
            <>
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className={styles.label}>{item.label}</span>
            </>
          )
          const className = cn(
            styles.tab,
            "relative z-10 h-auto min-h-11 min-w-11 flex-col gap-1 rounded-full px-1 py-2 text-xs font-medium touch-manipulation hover:bg-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          )
          return item.href ? (
            <Button
              key={item.id}
              asChild
              variant="ghost"
              className={className}
              data-highlighted={selected === index}
            >
              <Link
                href={item.href}
                prefetch={false}
                aria-current={item.active ? "page" : undefined}
              >
                {contents}
              </Link>
            </Button>
          ) : (
            <Button
              key={item.id}
              ref={item.buttonRef}
              type="button"
              variant="ghost"
              className={className}
              data-highlighted={selected === index}
              aria-expanded={item.expanded}
              aria-controls={item.controls}
              onClick={item.onSelect}
            >
              {contents}
            </Button>
          )
        })}
      </nav>
    </div>
  )
}
