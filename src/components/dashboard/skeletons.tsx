import { Skeleton } from "@/components/ui/skeleton"

export function SubscriptionStatusSkeleton() {
  return (
    <div className="px-4 lg:px-6">
      <div className="rounded-2xl border bg-card/60 p-6 shadow-sm">
        <Skeleton className="mb-4 h-5 w-40" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-4 h-8 w-32" />
      </div>
    </div>
  )
}

export function SectionCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-4 rounded-xl border bg-card/70 p-6 shadow-sm"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="px-4 lg:px-6">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <Skeleton className="mb-6 h-5 w-36" />
        <Skeleton className="h-56 w-full" />
      </div>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="px-4 lg:px-6">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <Skeleton className="mb-4 h-5 w-28" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ClassesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-xl border bg-card/60 p-6 shadow-sm">
          <Skeleton className="mb-2 h-5 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-8 w-full" />
        </div>
      ))}
    </div>
  )
}
