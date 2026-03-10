"use client"

import { cn } from "@/lib/utils"

export function GridBackground({
  className,
  faded = true,
}: {
  className?: string
  faded?: boolean
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative h-full w-full overflow-hidden bg-white dark:bg-black",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 [background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
        )}
      />
      {faded ? (
        <div className="pointer-events-none absolute inset-0 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black" />
      ) : null}
    </div>
  )
}
