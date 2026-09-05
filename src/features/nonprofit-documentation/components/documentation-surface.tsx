import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import density from "./documentation-density.module.css"

export function DocumentationSurface({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "bg-background h-full min-h-0 overflow-y-auto overscroll-contain [--radius:0.625rem] motion-safe:scroll-smooth [&_h2[id]]:[scroll-margin-top:var(--documentation-anchor-offset,6rem)] [&_h3[id]]:[scroll-margin-top:var(--documentation-anchor-offset,6rem)] [&_section[id]]:[scroll-margin-top:var(--documentation-anchor-offset,6rem)]",
        density.surface,
        className
      )}
      data-documentation-scroll
    >
      <a
        href="#documentation-content"
        className="bg-background text-foreground focus-visible:ring-ring sr-only z-50 rounded-md px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus-visible:ring-2"
      >
        Skip to documentation
      </a>
      {children}
    </div>
  )
}

export function DocumentationJsonLd({ value }: { value: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(value).replace(/</g, "\\u003c"),
      }}
    />
  )
}
