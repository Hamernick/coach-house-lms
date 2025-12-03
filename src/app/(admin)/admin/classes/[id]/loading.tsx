import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminClassDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle>Class details</CardTitle>
            <CardDescription>Loading metadata…</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-9 w-16 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>

        <Card className="bg-card/60">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Modules</CardTitle>
              <CardDescription>Preparing module list…</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle>People</CardTitle>
            <CardDescription>Loading enrolled learners…</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
            </div>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
