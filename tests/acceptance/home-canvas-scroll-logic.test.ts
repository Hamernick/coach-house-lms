import { describe, expect, it } from "vitest"

import { resolveSwipeSectionDelta, resolveWheelSectionDelta } from "@/components/public/home-canvas-scroll"

const nonScrollablePanel = {
  scrollTop: 0,
  scrollHeight: 500,
  clientHeight: 500,
}

const scrollableAtTop = {
  scrollTop: 0,
  scrollHeight: 1200,
  clientHeight: 500,
}

const scrollableMid = {
  scrollTop: 200,
  scrollHeight: 1200,
  clientHeight: 500,
}

const scrollableAtBottom = {
  scrollTop: 700,
  scrollHeight: 1200,
  clientHeight: 500,
}

const scrollableNearBottom = {
  scrollTop: 699.25,
  scrollHeight: 1200,
  clientHeight: 500,
}

const scrollableNearTop = {
  scrollTop: 0.75,
  scrollHeight: 1200,
  clientHeight: 500,
}

describe("home-canvas scroll decision logic", () => {
  it("changes section on wheel when panel is non-scrollable", () => {
    expect(
      resolveWheelSectionDelta({
        deltaY: 80,
        isAnimating: false,
        panel: nonScrollablePanel,
      }),
    ).toBe(1)

    expect(
      resolveWheelSectionDelta({
        deltaY: -80,
        isAnimating: false,
        panel: nonScrollablePanel,
      }),
    ).toBe(-1)
  })

  it("keeps wheel scrolling inside panel until reaching boundaries", () => {
    expect(
      resolveWheelSectionDelta({
        deltaY: 100,
        isAnimating: false,
        panel: scrollableMid,
      }),
    ).toBeNull()

    expect(
      resolveWheelSectionDelta({
        deltaY: -100,
        isAnimating: false,
        panel: scrollableMid,
      }),
    ).toBeNull()

    expect(
      resolveWheelSectionDelta({
        deltaY: 100,
        isAnimating: false,
        panel: scrollableAtBottom,
      }),
    ).toBe(1)

    expect(
      resolveWheelSectionDelta({
        deltaY: -100,
        isAnimating: false,
        panel: scrollableAtTop,
      }),
    ).toBe(-1)
  })

  it("ignores wheel gestures while animating or under threshold", () => {
    expect(
      resolveWheelSectionDelta({
        deltaY: 100,
        isAnimating: true,
        panel: scrollableAtBottom,
      }),
    ).toBeNull()

    expect(
      resolveWheelSectionDelta({
        deltaY: 10,
        isAnimating: false,
        panel: scrollableAtBottom,
      }),
    ).toBeNull()
  })

  it("treats near-edge float positions as boundaries for handoff", () => {
    expect(
      resolveWheelSectionDelta({
        deltaY: 100,
        isAnimating: false,
        panel: scrollableNearBottom,
      }),
    ).toBe(1)

    expect(
      resolveWheelSectionDelta({
        deltaY: -100,
        isAnimating: false,
        panel: scrollableNearTop,
      }),
    ).toBe(-1)
  })

  it("changes section on vertical swipe only at boundaries", () => {
    expect(
      resolveSwipeSectionDelta({
        deltaX: 10,
        deltaY: -120,
        isAnimating: false,
        panel: scrollableMid,
      }),
    ).toBeNull()

    expect(
      resolveSwipeSectionDelta({
        deltaX: 10,
        deltaY: -120,
        isAnimating: false,
        panel: scrollableAtBottom,
      }),
    ).toBe(1)

    expect(
      resolveSwipeSectionDelta({
        deltaX: 10,
        deltaY: 120,
        isAnimating: false,
        panel: scrollableAtTop,
      }),
    ).toBe(-1)
  })

  it("ignores horizontal/weak swipes and in-flight animation", () => {
    expect(
      resolveSwipeSectionDelta({
        deltaX: 80,
        deltaY: 70,
        isAnimating: false,
        panel: scrollableAtBottom,
      }),
    ).toBeNull()

    expect(
      resolveSwipeSectionDelta({
        deltaX: 5,
        deltaY: 40,
        isAnimating: false,
        panel: scrollableAtBottom,
      }),
    ).toBeNull()

    expect(
      resolveSwipeSectionDelta({
        deltaX: 5,
        deltaY: -120,
        isAnimating: true,
        panel: scrollableAtBottom,
      }),
    ).toBeNull()
  })

  it("keeps wheel blocked but allows swipe handoff when panel metrics are unavailable", () => {
    expect(
      resolveWheelSectionDelta({
        deltaY: 90,
        isAnimating: false,
        panel: null,
      }),
    ).toBeNull()

    expect(
      resolveSwipeSectionDelta({
        deltaX: 2,
        deltaY: -110,
        isAnimating: false,
        panel: undefined,
      }),
    ).toBe(1)
  })
})
