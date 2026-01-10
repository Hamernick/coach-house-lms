import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern/index"
import Image from "next/image"
import { cn } from "@/lib/utils"

export type ProgramCardProps = {
  title: string
  org?: string
  location?: string
  imageUrl?: string
  statusLabel?: string
  chips?: string[]
  goalCents?: number
  raisedCents?: number
  asOf?: string
  ctaLabel?: string
  ctaHref?: string
  ctaTarget?: string
  onCtaClick?: () => void
  patternId?: string
  className?: string
}

export function ProgramCard({
  title,
  org,
  location,
  imageUrl = "",
  statusLabel = "In progress",
  chips = [],
  goalCents = 0,
  raisedCents = 0,
  asOf,
  ctaLabel = "Action",
  ctaHref,
  ctaTarget = "_blank",
  onCtaClick,
  patternId,
  className,
}: ProgramCardProps) {
  const goal = goalCents || 0
  const raised = raisedCents || 0
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0
  const asOfText = asOf

  const money = (cents: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
      Math.max(0, Math.round(cents / 100)),
    )

  const headerSquares: Array<[number, number]> = [
    [4, 4],
    [5, 1],
    [8, 2],
    [5, 3],
    [5, 5],
    [10, 10],
    [12, 15],
    [15, 10],
    [10, 15],
    [15, 10],
    [10, 15],
    [15, 10],
  ]

  return (
    <Card
      className={cn(
        "w-full max-w-[380px] overflow-hidden rounded-3xl border-muted/50 shadow-sm flex flex-col py-0 gap-0",
        className,
      )}
    >
      <div className="relative">
        <div className="relative overflow-hidden aspect-[16/9] bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Program visual"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 90vw, 380px"
            />
          ) : (
            <GridPattern
              patternId={patternId}
              squares={headerSquares}
              className="absolute inset-0 opacity-85 fill-gray-500/50 stroke-gray-500/50 dark:fill-white/15 dark:stroke-white/25 [mask-image:radial-gradient(220px_circle_at_center,white,transparent)]"
            />
          )}
          <div className="absolute right-3 top-3">
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-1 text-xs font-medium border border-white/30 bg-white/50 backdrop-blur-sm dark:border-white/20 dark:bg-black/40"
            >
              {statusLabel}
            </Badge>
          </div>
        </div>
      </div>

      <CardContent className="px-4 pt-3 pb-4 flex-1">
        <h3 className="text-lg font-semibold leading-6">{title}</h3>
        {(org || location) ? (
          <p className="text-sm text-muted-foreground mt-0.5">{[org, location].filter(Boolean).join(" · ")}</p>
        ) : null}

        <Separator className="my-2.5" />

        {chips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((c, i) => (
              <Badge key={`${c}-${i}`} variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                {c}
              </Badge>
            ))}
          </div>
        ) : null}

        <Separator className="my-2.5" />

        <div className="mt-2 space-y-1.5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">Fundraising Progress</span>
            <span className="tabular-nums text-muted-foreground">
              {money(raised)} / {money(goal)}{asOfText ? ` · ${asOfText}` : ""}
            </span>
          </div>
          <Progress value={pct} aria-label={`Funding progress ${pct}%`} />
          <div className="text-xs text-muted-foreground">{pct}% funded</div>
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0 flex justify-end">
        {ctaHref ? (
          <Button size="sm" asChild>
            <a
              href={ctaHref}
              target={ctaTarget}
              rel={ctaTarget === "_blank" ? "noopener noreferrer" : undefined}
            >
              {ctaLabel}
            </a>
          </Button>
        ) : (
          <Button size="sm" onClick={onCtaClick} disabled={!onCtaClick}>
            {ctaLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
