"use client"

import type { ReactNode } from "react"
import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"

export function DocumentationTaskCards({ children }: { children: ReactNode }) {
  return (
    <div
      {...getReactGrabOwnerProps({
        ownerId: "documentation-home:task-cards",
        component: "DocumentationTaskCards",
        source:
          "src/features/nonprofit-documentation/components/documentation-task-cards.tsx",
        slot: "task-cards",
        tokenSource: "src/app/globals.css",
      })}
      className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
    >
      {children}
    </div>
  )
}
