"use client"

import Link from "next/link"

import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"

import { FiscalSponsorshipDialog } from "@/components/public/fiscal-sponsorship-dialog"
import { type Highlight } from "@/components/public/legacy-home-sections-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type LegacyHomeHighlightCardProps = {
  item: Highlight
  className?: string
}

export function LegacyHomeHighlightCard({ item, className }: LegacyHomeHighlightCardProps) {
  const isInteractive = Boolean(item.href || item.modal)
  const baseClassName = cn(
    "group relative flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-sm transition duration-300 ease-out",
    isInteractive && "hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    className,
  )
  const content = (
    <>
      {isInteractive ? (
        <span className="pointer-events-none absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/60 text-muted-foreground/70 shadow-sm ring-1 ring-border/40 transition group-hover:bg-background/80 group-hover:text-muted-foreground">
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </span>
      ) : null}
      <div className="flex h-full flex-col justify-between">
        <div className="flex flex-col items-start gap-3">
          <div className="flex w-full items-center justify-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              {item.icon}
            </div>
            {item.badge ? (
              <span className="inline-flex shrink-0 self-center rounded-full border border-border/70 bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {item.badge}
              </span>
            ) : null}
          </div>
          <div className="space-y-1 text-left">
            <p className="line-clamp-2 text-base font-semibold leading-tight text-foreground">{item.title}</p>
            <p className="line-clamp-3 text-sm text-muted-foreground">{item.description}</p>
          </div>
        </div>
      </div>
    </>
  )

  if (item.modal === "fiscal-sponsorship") {
    return (
      <FiscalSponsorshipDialog
        trigger={
          <Button
            type="button"
            variant="ghost"
            className={cn(
              baseClassName,
              "h-auto w-full touch-manipulation justify-start whitespace-normal text-left hover:bg-transparent",
            )}
          >
            {content}
          </Button>
        }
      />
    )
  }

  if (!item.href) {
    return <div className={baseClassName}>{content}</div>
  }

  return (
    <Link
      href={item.href}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noreferrer noopener" : undefined}
      className={baseClassName}
    >
      {content}
    </Link>
  )
}
