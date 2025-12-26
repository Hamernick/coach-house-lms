import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPageLoading() {
  return (
    <div className="w-full space-y-4 md:-m-2">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} className="h-[72px] w-full rounded-2xl" />
        ))}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <Card className="border-border/70 bg-card/70">
          <CardHeader className="space-y-4 pb-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-[min(420px,80vw)]" />
              <Skeleton className="h-4 w-[min(360px,70vw)]" />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <Skeleton className="h-[92px] w-full rounded-xl" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, idx) => (
                <Skeleton key={idx} className="h-[76px] w-full rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-4 lg:justify-self-end lg:self-start">
          <Skeleton className="h-[300px] w-full rounded-2xl border border-border/70 bg-card/70" />
          <Skeleton className="h-[162px] w-full rounded-2xl border border-border/70 bg-card/70" />
        </div>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, idx) => (
          <Skeleton key={idx} className="h-[310px] w-full rounded-2xl border border-border/70 bg-card/70" />
        ))}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/70">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-[56px] w-full rounded-xl" />
            ))}
          </CardContent>
          <CardFooter className="border-t border-border/60">
            <Skeleton className="h-9 w-full rounded-xl sm:w-[190px]" />
          </CardFooter>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[140px] w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
