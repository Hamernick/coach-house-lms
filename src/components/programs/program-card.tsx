import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern/index"
import Image from "next/image"

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
  onCtaClick?: () => void
  patternId?: string
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
  onCtaClick,
  patternId,
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
    <Card className="w-[380px] h-[600px] overflow-hidden rounded-3xl shadow-sm border-muted/50 flex flex-col py-0 gap-0">
      <div className="relative p-[5px] pb-0">
        <div className="relative overflow-hidden rounded-[var(--radius-program-image)] aspect-[4/3] bg-muted">
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
              className="absolute inset-0 opacity-70 [mask-image:radial-gradient(220px_circle_at_center,white,transparent)]"
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

      <CardContent className="px-5 pt-3 pb-5 flex-1">
        <h3 className="text-xl font-semibold leading-6">{title}</h3>
        {(org || location) ? (
          <p className="text-sm text-muted-foreground mt-0.5">{[org, location].filter(Boolean).join(" · ")}</p>
        ) : null}

        <Separator className="my-3" />

        {chips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((c, i) => (
              <Badge key={`${c}-${i}`} variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                {c}
              </Badge>
            ))}
          </div>
        ) : null}

        <Separator className="my-3" />

        <div className="mt-2 space-y-2">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="tabular-nums text-muted-foreground">
              {money(raised)} / {money(goal)}{asOfText ? ` · ${asOfText}` : ""}
            </span>
          </div>
          <Progress value={pct} aria-label={`Funding progress ${pct}%`} />
          <div className="text-xs text-muted-foreground">{pct}% funded</div>
        </div>
      </CardContent>

      <CardFooter className="px-5 pb-5 pt-0 flex justify-end">
        {ctaHref ? (
          <Button size="sm" asChild>
            <a href={ctaHref} target="_blank" rel="noopener noreferrer">{ctaLabel}</a>
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
