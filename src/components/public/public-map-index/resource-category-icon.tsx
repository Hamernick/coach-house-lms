import type { CSSProperties } from "react"

import {
  resolvePublicMapResourceCategoryIconDefinition,
  resolvePublicMapResourceCategoryIconPaths,
} from "@/lib/public-map/resource-category-icon-paths"
import type { PublicMapResourceCategoryKey } from "@/lib/public-map/resource-categories"
import { cn } from "@/lib/utils"

export function resolvePublicMapResourceCategoryIcon(
  category: PublicMapResourceCategoryKey
) {
  return resolvePublicMapResourceCategoryIconPaths(category)
}

export function PublicMapResourceCategoryIcon({
  category,
  className,
  style,
}: {
  category: PublicMapResourceCategoryKey
  className?: string
  style?: CSSProperties
}) {
  const icon = resolvePublicMapResourceCategoryIconDefinition(category)

  return (
    <svg
      aria-hidden
      className={cn("size-4 shrink-0", className)}
      data-public-map-filled-icon={icon.mode === "fill" ? "true" : undefined}
      data-public-map-icon-mode={icon.mode}
      data-public-map-resource-category-icon={category}
      fill={icon.mode === "fill" ? "currentColor" : "none"}
      focusable="false"
      stroke={icon.mode === "stroke" ? "currentColor" : undefined}
      strokeLinecap={icon.mode === "stroke" ? icon.strokeLinecap : undefined}
      strokeLinejoin={icon.mode === "stroke" ? icon.strokeLinejoin : undefined}
      strokeWidth={icon.mode === "stroke" ? icon.strokeWidth : undefined}
      style={style}
      viewBox={`0 0 ${icon.viewBoxSize} ${icon.viewBoxSize}`}
    >
      {icon.paths.map((path) => (
        <path d={path} key={path} />
      ))}
    </svg>
  )
}

export function PublicMapAllCategoryIcon({
  className,
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      aria-hidden
      className={cn("size-4 shrink-0", className)}
      data-public-map-filled-icon="true"
      data-public-map-resource-category-icon="all"
      fill="currentColor"
      focusable="false"
      style={style}
      viewBox="0 0 256 256"
    >
      <circle cx="128" cy="128" r="88" />
    </svg>
  )
}
