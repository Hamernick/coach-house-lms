"use client"

import { LegacyHomeAcceleratorOverviewSectionBlock } from "@/components/public/legacy-home-accelerator-overview/legacy-home-accelerator-overview-section-block"
import { legacyHomeHeadingFont, legacyHomeInterFont } from "@/components/public/legacy-home-sections/fonts"

export function LegacyHomeAcceleratorOverviewSection() {
  return (
    <LegacyHomeAcceleratorOverviewSectionBlock
      headingClassName={legacyHomeHeadingFont.className}
      interClassName={legacyHomeInterFont.className}
    />
  )
}
