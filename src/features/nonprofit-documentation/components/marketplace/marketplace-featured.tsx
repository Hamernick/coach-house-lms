import Link from "next/link"
import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"
import { Button } from "@/components/ui/button"

export function MarketplaceFeatured() {
  return (
    <div className="mb-5 grid overflow-hidden rounded-2xl border md:grid-cols-[minmax(0,1fr)_minmax(14rem,0.7fr)]">
      <div className="bg-muted/20 p-4 sm:p-5">
        <p className="text-muted-foreground text-xs font-medium">
          Google Ad Grants
        </p>
        <h2 className="mt-1 max-w-lg text-lg font-semibold tracking-tight text-balance">
          Help the right people find your work.
        </h2>
        <p className="text-muted-foreground mt-1 max-w-lg text-sm leading-5">
          Up to $10,000 per month in Search ads for eligible nonprofits. Start
          with a useful campaign, a clear destination, and an action you can
          measure.
        </p>
        <Button asChild className="mt-3 min-h-11 rounded-full">
          <Link href="/documentation/marketplace/google-ad-grants">
            See the offer & setup guide
            <ArrowRightIcon aria-hidden />
          </Link>
        </Button>
      </div>
      <div
        className="relative flex min-h-36 flex-col justify-end overflow-hidden bg-[radial-gradient(ellipse_at_15%_15%,#4754bc,transparent_65%),radial-gradient(ellipse_at_85%_20%,#546380,transparent_70%),linear-gradient(145deg,#472876,#142c63)] p-4 text-white sm:p-5"
        aria-label="Up to 10,000 U.S. dollars per month in Search advertising credit"
      >
        <span className="text-sm text-white/80">Up to</span>
        <p
          className="mt-1 text-3xl font-medium tracking-tight tabular-nums"
          aria-hidden
        >
          $10,000
          <span className="ml-1 text-base font-normal tracking-normal">
            /mo
          </span>
        </p>
        <p className="mt-3 text-sm text-white/80">Search advertising credit</p>
      </div>
    </div>
  )
}
