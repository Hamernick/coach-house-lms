import { CommunityMapSkeleton } from "@/components/community/community-map-skeleton"
import { Separator } from "@/components/ui/separator"

export default function CommunityLoading() {
  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded-md bg-muted/70" />
          <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-80 animate-pulse rounded-md bg-muted/80" />
        </div>
        <CommunityMapSkeleton />
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded-md bg-muted/80" />
        </div>
        <Separator />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border bg-card/70 p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-64 animate-pulse rounded-md bg-muted/80" />
                  <div className="h-3 w-48 animate-pulse rounded-md bg-muted/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
