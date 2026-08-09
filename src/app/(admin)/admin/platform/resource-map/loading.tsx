import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminPlatformResourceMapLoading() {
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-[1400px] space-y-4 px-4 py-5 md:px-6 md:py-6"
      aria-label="Loading resource map review"
    >
      <header className="border-border/70 space-y-3 border-b pb-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </header>
      <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="grid gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-3">
            <Skeleton className="h-6 w-64 max-w-full" />
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
