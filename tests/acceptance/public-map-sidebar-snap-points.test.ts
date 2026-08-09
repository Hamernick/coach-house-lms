import { describe, expect, it } from "vitest"

import {
  buildPublicMapDrawerSnapPoints,
  resolvePublicMapDrawerSnapPointIndex,
} from "@/components/public/public-map-index/sidebar-snap-points"

describe("buildPublicMapDrawerSnapPoints", () => {
  it("derives pixel snap points from the measured canvas height", () => {
    expect(buildPublicMapDrawerSnapPoints(520)).toEqual(["168px", "336px", 1])
  })

  it("keeps tall canvases collapsed below the result list", () => {
    expect(buildPublicMapDrawerSnapPoints(980)).toEqual(["168px", "549px", 1])
  })

  it("returns stable fallback pixel snaps before measurement", () => {
    expect(buildPublicMapDrawerSnapPoints(0)).toEqual(["168px", "336px", 1])
  })

  it("resolves snap values after the measured height shifts", () => {
    const snapPoints = buildPublicMapDrawerSnapPoints(980)

    expect(
      resolvePublicMapDrawerSnapPointIndex({
        snapPoint: "982px",
        snapPoints,
        surfaceHeight: 980,
      })
    ).toBe(2)
    expect(
      resolvePublicMapDrawerSnapPointIndex({
        snapPoint: "550px",
        snapPoints,
        surfaceHeight: 980,
      })
    ).toBe(1)
    expect(
      resolvePublicMapDrawerSnapPointIndex({
        snapPoint: 1,
        snapPoints,
        surfaceHeight: 980,
      })
    ).toBe(2)
  })

  it("ignores missing or invalid snap values", () => {
    const snapPoints = buildPublicMapDrawerSnapPoints(980)

    expect(
      resolvePublicMapDrawerSnapPointIndex({
        snapPoint: null,
        snapPoints,
        surfaceHeight: 980,
      })
    ).toBeNull()
    expect(
      resolvePublicMapDrawerSnapPointIndex({
        snapPoint: "invalid",
        snapPoints,
        surfaceHeight: 980,
      })
    ).toBeNull()
  })
})
