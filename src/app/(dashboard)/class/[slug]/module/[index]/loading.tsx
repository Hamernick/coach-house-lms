"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function ModuleLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-8">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  )
}
