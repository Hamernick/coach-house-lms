import { forwardRef, type ComponentPropsWithoutRef } from "react"

import { cn } from "@/lib/utils"

export type ScrollFadeEffectProps = ComponentPropsWithoutRef<"div"> & {
  /**
   * Whether to apply the fade utility classes.
   * @defaultValue true
   */
  enabled?: boolean
  /**
   * Scroll direction to apply the fade effect.
   * @defaultValue "vertical"
   * */
  orientation?: "horizontal" | "vertical"
}

export const ScrollFadeEffect = forwardRef<HTMLDivElement, ScrollFadeEffectProps>(function ScrollFadeEffect(
  {
    className,
    enabled = true,
    orientation = "vertical",
    ...props
  },
  ref,
) {
  return (
    <div
      ref={ref}
      data-orientation={orientation}
      className={cn(
        enabled &&
          "data-[orientation=horizontal]:overflow-x-auto data-[orientation=vertical]:overflow-y-auto",
        enabled &&
          "data-[orientation=horizontal]:scroll-fade-effect-x data-[orientation=vertical]:scroll-fade-effect-y",
        className,
      )}
      {...props}
    />
  )
})
