import CheckIcon from "lucide-react/dist/esm/icons/check"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"

import type { BestPracticeArticle } from "../types"

import { DocumentationStageGuidance } from "./documentation-stage-guidance"

type ArticleSectionProps = { article: BestPracticeArticle }

export function BestPracticeCoreSections({ article }: ArticleSectionProps) {
  return (
    <>
      <section
        id="definition"
        className="scroll-mt-8 border-b py-4"
        aria-labelledby="definition-title"
      >
        <h2
          id="definition-title"
          className="text-lg leading-tight font-semibold tracking-[-0.025em]"
        >
          {article.labels.definition}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm leading-5">
          {article.definition}
        </p>
      </section>

      <section
        id="why-it-matters"
        className="scroll-mt-8 border-b py-4"
        aria-labelledby="why-title"
      >
        <h2
          id="why-title"
          className="text-lg leading-tight font-semibold tracking-[-0.025em]"
        >
          Why it matters
        </h2>
        <ul className="mt-2 space-y-2">
          {article.whyItMatters.map((item) => (
            <li
              key={item}
              className="grid grid-cols-[1.25rem_1fr] gap-3 text-sm leading-5 sm:text-sm"
            >
              <CheckIcon className="mt-1 size-4" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="bg-muted/30 mt-2 rounded-xl border px-4 py-4 text-sm leading-5">
          <strong>Important distinction:</strong> {article.importantNote}
        </div>
      </section>
    </>
  )
}

export function BestPracticeStagesSection({ article }: ArticleSectionProps) {
  return (
    <section
      id="stages"
      className="scroll-mt-8 border-b py-4"
      aria-labelledby="stages-title"
    >
      <p className="text-muted-foreground text-xs font-semibold tracking-normal">
        Stage-specific guidance
      </p>
      <h2
        id="stages-title"
        className="mt-1 text-lg leading-tight font-semibold tracking-[-0.025em]"
      >
        {article.labels.stages}
      </h2>
      <DocumentationStageGuidance stages={article.stages} />
    </section>
  )
}

export function BestPracticeExampleAndFramework({
  article,
}: ArticleSectionProps) {
  return (
    <>
      <section
        id="example"
        className="scroll-mt-8 border-b py-4"
        aria-labelledby="example-title"
      >
        <p className="text-muted-foreground text-xs font-semibold tracking-normal">
          {article.labels.example}
        </p>
        <h2
          id="example-title"
          className="mt-1 text-lg leading-tight font-semibold tracking-[-0.025em]"
        >
          {article.example.name}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm leading-5">
          {article.example.context}
        </p>
        <div className="bg-border mt-2 grid gap-px overflow-hidden rounded-xl border sm:grid-cols-2">
          <div className="bg-background p-4">
            <p className="text-muted-foreground text-xs font-semibold">
              {article.example.weakLabel}
            </p>
            <p className="mt-1 text-sm leading-5">“{article.example.weak}”</p>
          </div>
          <div className="bg-background p-4">
            <p className="text-xs font-semibold">
              {article.example.strongLabel}
            </p>
            <p className="mt-1 text-sm leading-5">“{article.example.strong}”</p>
          </div>
        </div>
        <p className="text-muted-foreground mt-1 text-sm leading-5">
          {article.example.reason}
        </p>
      </section>

      <section
        id="framework"
        className="scroll-mt-8 border-b py-4"
        aria-labelledby="framework-title"
      >
        <h2
          id="framework-title"
          className="text-lg leading-tight font-semibold tracking-[-0.025em]"
        >
          {article.labels.framework}
        </h2>
        <ol className="mt-2 divide-y border-y">
          {article.framework.map((step, index) => (
            <li
              key={step.title}
              className="grid gap-4 py-4 sm:grid-cols-[2rem_1fr]"
            >
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm leading-5">
                  {step.instruction}
                </p>
                <p className="mt-1 text-sm leading-5 italic">
                  Prompt: {step.prompt}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}

export function BestPracticeChecklistAndMistakes({
  article,
}: ArticleSectionProps) {
  return (
    <>
      <section
        id="checklist"
        className="scroll-mt-8 border-b py-4"
        aria-labelledby="checklist-title"
      >
        <h2
          id="checklist-title"
          className="text-lg leading-tight font-semibold tracking-[-0.025em]"
        >
          {article.labels.checklist}
        </h2>
        <ul className="bg-border mt-2 grid gap-px overflow-hidden rounded-xl border sm:grid-cols-2">
          {article.checklist.map((item) => (
            <li
              key={item}
              className="bg-background grid grid-cols-[1.25rem_1fr] gap-3 p-4 text-sm leading-5"
            >
              <CheckIcon className="mt-1 size-4" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="mistakes"
        className="scroll-mt-8 border-b py-4"
        aria-labelledby="mistakes-title"
      >
        <h2
          id="mistakes-title"
          className="text-lg leading-tight font-semibold tracking-[-0.025em]"
        >
          {article.labels.mistakes}
        </h2>
        <dl className="mt-2 divide-y border-y">
          {article.mistakes.map((item) => (
            <div key={item.mistake} className="py-3">
              <dt className="leading-5 font-semibold">{item.mistake}</dt>
              <dd className="text-muted-foreground mt-1 text-sm leading-5">
                {item.correction}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}

export function BestPracticeMeasuresAndSources({
  article,
}: ArticleSectionProps) {
  return (
    <>
      <section
        id="measures"
        className="scroll-mt-8 border-b py-4"
        aria-labelledby="measures-title"
      >
        <h2
          id="measures-title"
          className="text-lg leading-tight font-semibold tracking-[-0.025em]"
        >
          {article.labels.measures}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm leading-5">
          {article.measuresIntroduction}
        </p>
        <ol className="mt-2 space-y-2">
          {article.measures.map((item, index) => (
            <li
              key={item}
              className="grid grid-cols-[2rem_1fr] gap-3 text-sm leading-5"
            >
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </section>

      <section
        id="sources"
        className="scroll-mt-8 py-4"
        aria-labelledby="sources-title"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-normal">
              Primary references
            </p>
            <h2
              id="sources-title"
              className="mt-1 text-lg leading-tight font-semibold tracking-[-0.025em]"
            >
              Sources and review
            </h2>
          </div>
          <span className="text-muted-foreground text-xs">
            Reviewed {article.reviewedDate}
          </span>
        </div>
        <ul className="mt-2 divide-y border-y">
          {article.sources.map((source) => (
            <li key={source.url} className="py-3">
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="focus-visible:ring-ring inline-flex min-h-11 items-start gap-2 py-2 font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
              >
                {source.title}
                <ExternalLinkIcon
                  className="mt-1 size-3.5 shrink-0"
                  aria-hidden
                />
              </a>
              <p className="text-muted-foreground mt-1 text-xs">
                {source.publisher}
              </p>
              <p className="text-muted-foreground mt-1 text-sm leading-5">
                {source.note}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground mt-3 text-xs leading-5">
          {article.disclaimer}
        </p>
      </section>
    </>
  )
}
