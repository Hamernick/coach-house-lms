import LoaderCircleIcon from "lucide-react/dist/esm/icons/loader-circle"

import { HomeCanvasPreview } from "@/components/public/home-canvas-preview"
import { Skeleton } from "@/components/ui/skeleton"

function FindRouteLoadingPanel() {
  return (
    <div className="relative h-full min-h-0 p-4 md:p-5">
      <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="hidden min-h-0 flex-col gap-4 lg:flex">
          <div className="rounded-[24px] border border-border/70 bg-card/70 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <LoaderCircleIcon className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
              <span>Loading organizations…</span>
            </div>
            <Skeleton className="mt-4 h-10 w-full rounded-xl" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-[24px] border border-border/70 bg-card/70 p-4 shadow-sm">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        </aside>

        <div className="relative min-h-0 overflow-hidden rounded-[28px] border border-border/70 bg-card/50 shadow-sm">
          <Skeleton className="absolute inset-0 rounded-none bg-muted/40" />
          <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/92 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur">
            <LoaderCircleIcon className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
            <span>Loading map…</span>
          </div>
          <div
            className="absolute inset-x-4 bottom-4 z-10 rounded-[22px] border border-border/70 bg-background/92 p-4 shadow-sm backdrop-blur lg:hidden"
            aria-hidden
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-10 w-full rounded-xl" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        Loading find map
      </p>
    </div>
  )
}

export default function PublicFindLoading() {
  return <HomeCanvasPreview initialSection="find" findPanel={<FindRouteLoadingPanel />} />
}
