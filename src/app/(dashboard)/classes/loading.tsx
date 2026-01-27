import { Skeleton } from "@/components/ui/skeleton"

export default function ClassesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-40" />
        ))}
      </div>
    </div>
  )
}
