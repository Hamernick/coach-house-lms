"use client"

import { useEffect, useState, type CSSProperties, type ReactNode } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ArticleView = "guide" | "tool"

export function DocumentationArticleWorkspace({
  guide,
  tool,
  defaultView,
}: {
  guide: ReactNode
  tool: ReactNode
  defaultView: ArticleView
}) {
  const [view, setView] = useState(defaultView)
  const [anchor, setAnchor] = useState("")

  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1)
      setView(
        hash
          ? hash === "sandbox" || hash.startsWith("tool-")
            ? "tool"
            : "guide"
          : defaultView
      )
      setAnchor(hash)
    }
    sync()
    window.addEventListener("hashchange", sync)
    window.addEventListener("popstate", sync)
    return () => {
      window.removeEventListener("hashchange", sync)
      window.removeEventListener("popstate", sync)
    }
  }, [defaultView])

  useEffect(() => {
    if (!anchor) return
    const frame = requestAnimationFrame(() =>
      document.getElementById(anchor)?.scrollIntoView({ block: "start" })
    )
    return () => cancelAnimationFrame(frame)
  }, [anchor, view])

  const changeView = (next: string) => {
    const selected = next === "tool" ? "tool" : "guide"
    const target = selected === "tool" ? "sandbox" : "guide"
    const url = new URL(window.location.href)
    url.hash = target
    window.history.pushState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`
    )
    setView(selected)
    setAnchor(target)
  }

  return (
    <Tabs
      value={view}
      onValueChange={changeView}
      className="gap-0"
      style={{ "--documentation-anchor-offset": "10rem" } as CSSProperties}
    >
      <TabsList
        className="rounded-full p-1 group-data-[orientation=horizontal]/tabs:h-11"
        aria-label="Guide and tool"
      >
        <TabsTrigger value="tool" className="min-h-9 rounded-full px-5">
          Use tool
        </TabsTrigger>
        <TabsTrigger value="guide" className="min-h-9 rounded-full px-5">
          Read guide
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="tool"
        forceMount
        className="data-[state=inactive]:hidden [&_[data-tool-intro]]:sr-only"
      >
        {tool}
      </TabsContent>
      <TabsContent
        value="guide"
        forceMount
        className="data-[state=inactive]:hidden"
      >
        <div id="guide" className="scroll-mt-40">
          {guide}
        </div>
      </TabsContent>
    </Tabs>
  )
}
