import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

const PALETTES: ReadonlyArray<readonly string[]> = [
  // soft warm
  ["#92B3C9", "#C6D1D1", "#7B8E54", "#F66E56", "#F3F4EC"],
  // pink / blue
  ["#EB4679", "#051681", "#EE7F7D", "#265BC9", "#7961D3"],
  // cobalt / magenta
  ["#0F2F65", "#E687D8", "#347BD1", "#6890E2", "#A88BDF"],
]

function hashSeed(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function getPalette(seed: string): readonly string[] {
  const idx = hashSeed(seed) % PALETTES.length
  return PALETTES[idx]
}

export function getNewsGradientPalette(seed: string): readonly string[] {
  return getPalette(seed)
}

export function NewsGradientThumb({
  seed,
  className,
}: {
  seed: string
  className?: string
}) {
  const [c1, c2, c3, c4, c5] = getPalette(seed)

  const style: CSSProperties = {
    backgroundImage: [
      `radial-gradient(circle at 0% 0%, ${c1} 0, transparent 55%)`,
      `radial-gradient(circle at 100% 0%, ${c2} 0, transparent 55%)`,
      `radial-gradient(circle at 0% 100%, ${c3} 0, transparent 55%)`,
      `radial-gradient(circle at 100% 100%, ${c4} 0, transparent 55%)`,
      `linear-gradient(135deg, ${c1}, ${c5}, ${c4})`,
    ].join(", "),
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-black/80",
        className,
      )}
      style={style}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#ffffff1a_1px,transparent_0)] bg-[length:4px_4px] mix-blend-soft-light opacity-40"
        aria-hidden
      />
    </div>
  )
}
