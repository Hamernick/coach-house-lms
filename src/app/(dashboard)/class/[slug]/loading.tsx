"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function ClassLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-8">
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        <Skeleton className="h-64 rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
