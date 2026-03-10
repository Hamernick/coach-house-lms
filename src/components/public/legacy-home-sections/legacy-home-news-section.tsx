"use client"

import Link from "next/link"

import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"

import { NewsGradientThumb } from "@/components/news/gradient-thumb"
import { LIBRARY_ITEMS } from "@/components/public/legacy-home-sections-data"
import { cn } from "@/lib/utils"

type LegacyHomeNewsSectionProps = {
  compact?: boolean
}

export function LegacyHomeNewsSection({ compact = false }: LegacyHomeNewsSectionProps) {
  return (
    <>
      <h2 className="text-left text-lg font-semibold text-foreground sm:col-span-2 lg:col-span-4">News</h2>
      {LIBRARY_ITEMS.map((item) => (
        <Link
          key={item.title}
          href={item.href}
          target={item.external ? "_blank" : undefined}
          rel={item.external ? "noreferrer noopener" : undefined}
          className={cn(
            "group flex flex-col rounded-[26px] bg-card/70 p-4 shadow-sm transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-md",
            compact ? "min-h-[280px]" : "min-h-[360px]",
          )}
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[22px] shadow-sm">
            <NewsGradientThumb seed={item.seed} className="absolute inset-0" />
            <span className="absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-sm transition group-hover:bg-background">
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </span>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-[11px] uppercase text-muted-foreground">{item.eyebrow}</p>
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.subtitle}</p>
          </div>
        </Link>
      ))}
    </>
  )
}
