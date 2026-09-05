import type { ReactNode } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { DocumentationSearchForm } from "./documentation-search-form"

export function DocumentationSurface({
  children,
  className,
  searchQuery,
}: {
  children: ReactNode
  className?: string
  searchQuery?: string
}) {
  return (
    <div
      className={cn(
        "bg-background h-full min-h-0 overflow-y-auto overscroll-contain motion-safe:scroll-smooth [&_section[id]]:scroll-mt-24 [&_h2[id]]:scroll-mt-24 [&_h3[id]]:scroll-mt-24",
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
      <div className="bg-background/95 sticky top-0 z-30 border-b px-5 py-3 backdrop-blur sm:px-8 lg:px-12 print:hidden">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
          <Link
            href="/documentation"
            className="text-muted-foreground hover:text-foreground hidden min-h-11 shrink-0 items-center text-sm font-medium sm:inline-flex"
          >
            Documentation
          </Link>
          <DocumentationSearchForm query={searchQuery} />
        </div>
      </div>
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
