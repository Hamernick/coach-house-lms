"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { useSearchParams } from "next/navigation"
import ArrowLeftIcon from "lucide-react/dist/esm/icons/arrow-left"
import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"
import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type DocumentationToolStep = {
  id: string
  label: string
  content: ReactNode
}

export function DocumentationToolFlow({
  steps,
  hasDraft = true,
}: {
  steps: DocumentationToolStep[]
  hasDraft?: boolean
}) {
  const params = useSearchParams()
  const requested = params.get("step")
  const current = Math.max(
    0,
    steps.findIndex((step) => step.id === requested)
  )
  const navigation = useRef<HTMLDivElement>(null)
  const activeId = steps[current].id
  const previousStep = useRef(activeId)
  useEffect(() => {
    if (previousStep.current !== activeId) {
      navigation.current?.scrollIntoView({ block: "start" })
      navigation.current
        ?.querySelector('[role="tab"][data-state="active"]')
        ?.scrollIntoView({ block: "nearest", inline: "nearest" })
    }
    previousStep.current = activeId
  }, [activeId])
  const changeStep = (id: string) => {
    const url = new URL(window.location.href)
    if (id === steps[0].id) url.searchParams.delete("step")
    else url.searchParams.set("step", id)
    url.hash = "sandbox"
    window.history.pushState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`
    )
    navigation.current?.scrollIntoView({ block: "start" })
  }
  return (
    <Tabs
      value={steps[current].id}
      onValueChange={changeStep}
      className="gap-0"
    >
      <div
        ref={navigation}
        className="scroll-mt-40 overflow-x-auto border-b px-5 py-3 sm:px-6"
      >
        <TabsList
          variant="line"
          className="min-w-max justify-start gap-x-4 group-data-[orientation=horizontal]/tabs:h-auto sm:min-w-0 sm:flex-wrap"
          aria-label="Planner steps"
        >
          {steps.map((step, index) => (
            <TabsTrigger
              key={step.id}
              value={step.id}
              className="min-h-11 flex-none px-1"
            >
              <span className="text-muted-foreground mr-1 tabular-nums">
                {index + 1}.
              </span>
              {step.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {steps.map((step) => (
        <TabsContent
          key={step.id}
          value={step.id}
          forceMount
          className="data-[state=inactive]:hidden"
        >
          {step.id === "review" && !hasDraft ? (
            <Empty
              className="m-5 rounded-2xl"
              title="Your plan will appear here"
              description="Add your details or load an example to see the working plan and export it."
            />
          ) : (
            step.content
          )}
        </TabsContent>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 rounded-full"
          disabled={current === 0}
          onClick={() => changeStep(steps[current - 1].id)}
        >
          <ArrowLeftIcon aria-hidden />
          Back
        </Button>
        <p className="text-muted-foreground text-xs">
          Step {current + 1} of {steps.length}
        </p>
        {current < steps.length - 1 ? (
          <Button
            type="button"
            className="min-h-11 rounded-full"
            onClick={() => changeStep(steps[current + 1].id)}
          >
            {current === steps.length - 2 ? "Review your plan" : "Continue"}
            <ArrowRightIcon aria-hidden />
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 rounded-full"
            onClick={() => changeStep(steps[0].id)}
          >
            Edit plan
          </Button>
        )}
      </div>
    </Tabs>
  )
}
