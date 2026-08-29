"use client"

import { gsap } from "gsap"
import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern/index"

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

function HomeMarketplaceLiveCount({ count }: { count: number | null }) {
  const countRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const element = countRef.current
    if (!element || count === null) return
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) {
      element.textContent = new Intl.NumberFormat().format(count)
      return
    }

    const counter = { value: 0 }
    const tween = gsap.to(counter, {
      duration: 0.68,
      ease: "power3.out",
      value: count,
      onUpdate: () => {
        element.textContent = new Intl.NumberFormat().format(
          Math.round(counter.value)
        )
      },
    })
    return () => tween.kill()
  }, [count])

  return (
    <p
      data-marketplace-intro="eyebrow"
      data-marketplace-live-count={count === null ? "loading" : String(count)}
      className="inline-flex min-h-8 items-center justify-center gap-2 rounded-full border border-white/18 bg-[#003f9e]/28 px-3.5 py-1.5 text-center font-mono text-[11px] tracking-[0.13em] whitespace-nowrap text-white/76 uppercase shadow-[0_10px_24px_-18px_rgba(0,0,0,0.7)] backdrop-blur-md"
      aria-live="polite"
    >
      <span className="relative flex size-2" aria-hidden>
        <span
          data-marketplace-live-pulse=""
          className="absolute inline-flex size-full rounded-full bg-[#7cffad]/55 motion-safe:animate-ping"
        />
        <span className="relative inline-flex size-2 rounded-full bg-[#7cffad]" />
      </span>
      <span ref={countRef} className="font-medium text-white tabular-nums">
        {count === null ? "—" : count}
      </span>
      <span>active resources</span>
    </p>
  )
}

export function HomeMarketplaceHero() {
  const [liveCount, setLiveCount] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    void fetch("/api/public/home-map-preview?v=5", {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { features?: unknown[] } | null) => {
        if (Array.isArray(payload?.features)) {
          setLiveCount(payload.features.length)
        }
      })
      .catch(() => {})

    return () => controller.abort()
  }, [])

  return (
    <section
      data-marketplace-hero=""
      aria-labelledby="marketplace-hero-title"
      className="relative isolate min-h-[150svh] overflow-clip bg-[#006bff] text-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(144,205,255,0.38),transparent_34%)]" />
      <div
        data-marketplace-hero-grid=""
        className="pointer-events-none absolute inset-x-[-18%] top-[34%] bottom-[-12%] [perspective-origin:50%_0%] [perspective:900px] sm:inset-x-[-12%] sm:top-[30%] sm:[perspective:1200px]"
        aria-hidden
      >
        <div
          data-marketplace-hero-grid-plane=""
          className="absolute inset-0 origin-top [transform:rotateX(67deg)] [mask-image:linear-gradient(to_bottom,transparent_0%,black_14%,black_76%,transparent_100%)] [transform-style:preserve-3d]"
        >
          <GridPattern
            patternId="marketplace-hero-perspective-grid"
            width={48}
            height={48}
            className="inset-0 h-full w-full fill-transparent stroke-white/[0.085]"
          />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[#0059ec] to-transparent" />

      <div
        data-marketplace-hero-sticky=""
        className="sticky top-0 flex h-[calc(100svh-5rem)] min-h-[32rem] flex-col items-center justify-center overflow-hidden [@media(max-height:650px)]:relative [@media(max-height:650px)]:h-auto [@media(max-height:650px)]:min-h-[52rem] [@media(max-height:650px)]:pb-8"
      >
        <div
          data-marketplace-hero-copy=""
          className="relative z-20 flex w-full max-w-[76rem] min-w-0 flex-col items-center px-6 text-center sm:px-10 lg:px-14"
        >
          <HomeMarketplaceLiveCount count={liveCount} />
          <h1
            id="marketplace-hero-title"
            className="mt-5 max-w-5xl text-[clamp(3.35rem,7.4vw,7.75rem)] leading-[0.86] font-semibold tracking-[-0.075em] text-balance"
          >
            <span data-marketplace-hero-line="" className="block text-white/52">
              Build &amp;
            </span>{" "}
            <span data-marketplace-hero-line="" className="mt-2 block">
              Collect NFP&apos;s.
            </span>
          </h1>
          <p
            data-marketplace-intro="summary"
            className="mt-6 max-w-xl text-base leading-6 text-pretty text-white/72 sm:text-lg sm:leading-7"
          >
            Collect basic resources provided by NFP&apos;s in your area or build
            your own.
          </p>
          <div
            data-marketplace-intro="actions"
            className="mt-6 flex flex-wrap items-center justify-center gap-3 max-[350px]:w-full max-[350px]:max-w-[13rem]"
          >
            <Button
              asChild
              size="lg"
              variant={null}
              className="group h-12 touch-manipulation rounded-full border border-white bg-white px-5 text-[#002359] shadow-[0_10px_28px_-16px_rgba(0,0,0,0.55)] transition-[background-color,color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#f0f7ff] focus-visible:ring-white/70 max-[350px]:w-full"
            >
              <Link href="/find">
                Collect NFPs
                <ArrowRightIcon
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant={null}
              className="group h-12 touch-manipulation rounded-full border border-white/24 bg-[#003f9e]/28 px-5 text-white backdrop-blur-md transition-[background-color,border-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-white/42 hover:bg-[#003f9e]/48 focus-visible:ring-white/70 has-[>svg]:pr-5 has-[>svg]:pl-6 max-[350px]:w-full"
            >
              <Link href="/?section=signup&intent=build">
                Build Yours
                <ArrowRightIcon
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
