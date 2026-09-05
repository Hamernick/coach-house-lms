"use client"

import { useEffect, useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { DocumentationStageGuidance as StageGuidance } from "../types"

export function DocumentationStageGuidance({
  stages,
}: {
  stages: StageGuidance[]
}) {
  const [stage, setStage] = useState<string>(stages[0]?.id ?? "")
  useEffect(() => {
    const sync = () => {
      const selected = stages.find(
        (item) => window.location.hash === `#${item.id}-title`
      )
      if (selected) setStage(selected.id)
    }
    sync()
    window.addEventListener("hashchange", sync)
    window.addEventListener("popstate", sync)
    return () => {
      window.removeEventListener("hashchange", sync)
      window.removeEventListener("popstate", sync)
    }
  }, [stages])
  return (
    <Accordion
      type="single"
      collapsible
      value={stage}
      onValueChange={setStage}
      className="mt-2"
    >
      {stages.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger className="gap-4 py-3 text-left">
            <span
              id={`${item.id}-title`}
              className="w-24 shrink-0 font-semibold"
            >
              {item.label}
            </span>
            <span className="flex-1 text-sm font-normal">{item.question}</span>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <p className="text-muted-foreground text-sm leading-5">
              {item.guidance}
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-5">
              {item.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
            <p className="bg-muted/40 mt-2 rounded-xl p-4 text-sm leading-5">
              <strong>Ready to move on when:</strong> {item.checkpoint}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
