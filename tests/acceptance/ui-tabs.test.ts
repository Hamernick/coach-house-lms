import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  Tabs,
  TabsList,
  TabsTrigger,
  tabsListVariants,
} from "@/components/ui/tabs"

describe("ui tabs", () => {
  it("supports the shadcn line variant on TabsList", () => {
    expect(tabsListVariants({ variant: "line" })).toContain("bg-transparent")
    expect(tabsListVariants({ variant: "line" })).toContain("gap-1")

    const markup = renderToStaticMarkup(
      React.createElement(
        Tabs,
        { defaultValue: "people" },
        React.createElement(
          TabsList,
          { variant: "line" },
          React.createElement(TabsTrigger, { value: "people" }, "People"),
          React.createElement(TabsTrigger, { value: "documents" }, "Documents")
        )
      )
    )

    expect(markup).toContain('data-variant="line"')
    expect(markup).toContain("group/tabs-list")
    expect(markup).toContain("bg-transparent")
    expect(markup).toContain("group-data-[variant=line]/tabs-list")
    expect(markup).toContain("data-[state=active]:after:opacity-100")
  })
})
