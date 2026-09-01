import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

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
        "bg-background h-full min-h-0 overflow-y-auto overscroll-contain scroll-smooth",
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
