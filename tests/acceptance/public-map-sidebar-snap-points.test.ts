import { describe, expect, it } from "vitest"

import { buildPublicMapDrawerSnapPoints } from "@/components/public/public-map-index/sidebar-snap-points"

describe("buildPublicMapDrawerSnapPoints", () => {
  it("derives pixel snap points from the measured canvas height", () => {
    expect(buildPublicMapDrawerSnapPoints(520)).toEqual([
      "168px",
      "336px",
      "468px",
    ])
  })

  it("caps the collapsed snap so tall canvases still open low", () => {
    expect(buildPublicMapDrawerSnapPoints(980)).toEqual([
      "216px",
      "549px",
      "882px",
    ])
  })

  it("returns stable fallback pixel snaps before measurement", () => {
    expect(buildPublicMapDrawerSnapPoints(0)).toEqual([
      "168px",
      "336px",
      "520px",
    ])
  })
})
