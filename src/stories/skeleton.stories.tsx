import { Skeleton } from "../components/ui/skeleton"

import type { StoryConfig } from "./types"

const skeletonStories = {
  title: "Design System/Skeleton",
  component: Skeleton,
  tags: ["design-system"],
  states: [
    {
      name: "Card",
      render: () => (
        <div className="grid gap-3 rounded-xl border p-6">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      ),
    },
  ],
} satisfies StoryConfig<typeof Skeleton>

export default skeletonStories
