"use client"

import { useCallback, useMemo, type ReactNode } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import ArrowLeftIcon from "lucide-react/dist/esm/icons/arrow-left"
import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import {
  DocumentationDecisionCanvasPanel,
  useDocumentationDecisionCanvasController,
  type DocumentationDecisionStep,
} from "@/features/documentation-decision-canvas"
import { getDocumentationToolMetadata } from "../lib/documentation-tools"
import styles from "./documentation-tool-flow.module.css"

export type DocumentationToolStep = DocumentationDecisionStep & {
  content: ReactNode
}

export function DocumentationToolFlow({
  steps,
  hasDraft = true,
  ready,
  draftFingerprint,
}: {
  steps: DocumentationToolStep[]
  hasDraft?: boolean
  ready: boolean
  draftFingerprint: string
}) {
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const requested = params.get("step")
  const current = Math.max(
    0,
    steps.findIndex((step) => step.id === requested)
  )
  const active = steps[current]
  const open = steps.some((step) => step.id === requested)
  const schema = JSON.stringify(
    steps.map(({ id, label, description, dependsOn }) => ({
      id,
      label,
      description,
      dependsOn,
    }))
  )
  const canvasSteps = useMemo<DocumentationDecisionStep[]>(
    () => JSON.parse(schema),
    [schema]
  )
  const { reviewed, markReviewed, savingUnavailable } =
    useDocumentationDecisionCanvasController({
      steps: canvasSteps,
      storageKey: `coach-house:decision-review:${pathname}`,
      draftFingerprint,
      ready,
      hasDraft,
      editingId: open ? active.id : null,
    })
  const title =
    getDocumentationToolMetadata(pathname.replace("/documentation/", ""))
      ?.title ?? "Your plan"
  const changeStep = useCallback(
    (id: string | null) => {
      const url = new URL(window.location.href)
      if (id) url.searchParams.set("step", id)
      else url.searchParams.delete("step")
      url.hash = "sandbox"
      router.push(`${url.pathname}${url.search}${url.hash}`, { scroll: false })
    },
    [router]
  )

  return (
    <>
      <DocumentationDecisionCanvasPanel
        title={title}
        steps={canvasSteps}
        activeId={
          open
            ? active.id
            : (
                canvasSteps.find((step) => !reviewed.includes(step.id)) ??
                canvasSteps[canvasSteps.length - 1]
              ).id
        }
        reviewed={reviewed}
        disabled={!ready}
        onSelect={changeStep}
        onClose={() => changeStep(null)}
        editor={
          open
            ? {
                id: active.id,
                label: active.label,
                positionLabel: `Step ${current + 1} of ${steps.length}`,
                description:
                  active.description ??
                  "Your draft stays connected as you move between steps.",
                content: (
                  <fieldset
                    disabled={!ready}
                    className={`${styles.editor} min-w-0`}
                  >
                    {active.id === "review" && !hasDraft ? (
                      <Empty
                        className="m-4 rounded-2xl"
                        title="Your plan will appear here"
                        description="Add your details or load an example to see the working plan and export it."
                      />
                    ) : (
                      active.content
                    )}
                  </fieldset>
                ),
                actions: (
                  <div className="flex w-full flex-wrap items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-11 shrink-0 rounded-full"
                      onClick={() =>
                        changeStep(current ? steps[current - 1].id : null)
                      }
                    >
                      <ArrowLeftIcon aria-hidden />
                      {current ? "Back" : "Canvas"}
                    </Button>
                    <Button
                      type="button"
                      disabled={!ready || (active.id === "review" && !hasDraft)}
                      className="min-h-11 rounded-full px-4"
                      onClick={() => {
                        markReviewed(active.id)
                        changeStep(
                          current < steps.length - 1
                            ? steps[current + 1].id
                            : null
                        )
                      }}
                    >
                      {current === steps.length - 1 ? (
                        <>
                          <CheckIcon aria-hidden />
                          Finish review
                        </>
                      ) : (
                        <>
                          {hasDraft ? "Reviewed & continue" : "Continue"}
                          <ArrowRightIcon aria-hidden />
                        </>
                      )}
                    </Button>
                  </div>
                ),
              }
            : null
        }
      />
      {savingUnavailable && (
        <p role="status" className="text-muted-foreground px-5 pb-4 text-xs">
          Review progress cannot be saved in this browser.
        </p>
      )}
    </>
  )
}
