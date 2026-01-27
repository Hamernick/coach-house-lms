import { RightRailSlot } from "@/components/app-shell/right-rail"
import { Skeleton } from "@/components/ui/skeleton"

export function RoadmapShellSkeleton() {
  return (
    <>
      <RightRailSlot>
        <div className="space-y-3">
          <Skeleton className="h-4 w-28 rounded-full" />
          <div className="space-y-1.5">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full rounded-md" />
            ))}
          </div>
        </div>
      </RightRailSlot>
      <div className="flex min-h-full flex-1 flex-col gap-6">
        <div className="w-full">
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-start sm:justify-between sm:pt-4">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start">
                <Skeleton className="size-12 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-7 w-48 rounded-full" />
                  <Skeleton className="h-4 w-72 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          </div>
        </div>

        <section className="flex w-full min-h-0 min-w-0 flex-1">
          <div className="mx-auto flex w-full min-h-0 max-w-3xl flex-1 flex-col gap-5">
            <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm sm:p-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-36 rounded-full" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-5/6 rounded-xl" />
                <Skeleton className="h-52 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
