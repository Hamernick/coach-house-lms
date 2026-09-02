import CheckIcon from "lucide-react/dist/esm/icons/check"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"

import type { BestPracticeArticle } from "../types"

type ArticleSectionProps = { article: BestPracticeArticle }

export function BestPracticeCoreSections({ article }: ArticleSectionProps) {
  return (
    <>
      <section
        id="definition"
        className="scroll-mt-8 border-b py-10"
        aria-labelledby="definition-title"
      >
        <h2
          id="definition-title"
          className="text-2xl font-semibold tracking-[-0.025em]"
        >
          {article.labels.definition}
        </h2>
        <p className="text-muted-foreground mt-4 text-base leading-7">
          {article.definition}
        </p>
      </section>

      <section
        id="why-it-matters"
        className="scroll-mt-8 border-b py-10"
        aria-labelledby="why-title"
      >
        <h2
          id="why-title"
          className="text-2xl font-semibold tracking-[-0.025em]"
        >
          Why it matters
        </h2>
        <ul className="mt-5 space-y-4">
          {article.whyItMatters.map((item) => (
            <li
              key={item}
              className="grid grid-cols-[1.25rem_1fr] gap-3 text-sm leading-6 sm:text-base sm:leading-7"
            >
              <CheckIcon className="mt-1 size-4" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-7 border-l-2 border-amber-500 bg-amber-500/8 px-5 py-4 text-sm leading-6">
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
      className="scroll-mt-8 border-b py-10"
      aria-labelledby="stages-title"
    >
      <p className="text-muted-foreground text-xs font-semibold tracking-[0.15em] uppercase">
        Stage-specific guidance
      </p>
      <h2
        id="stages-title"
        className="mt-2 text-2xl font-semibold tracking-[-0.025em]"
      >
        {article.labels.stages}
      </h2>
      <div className="mt-7 divide-y border-y">
        {article.stages.map((stage, index) => (
          <section
            key={stage.id}
            className="py-7"
            aria-labelledby={`${stage.id}-title`}
          >
            <div className="grid gap-4 sm:grid-cols-[8rem_1fr] sm:gap-8">
              <div>
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 id={`${stage.id}-title`} className="mt-2 font-semibold">
                  {stage.label}
                </h3>
              </div>
              <div>
                <p className="leading-6 font-semibold">{stage.question}</p>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {stage.guidance}
                </p>
                <ul className="mt-4 space-y-2 text-sm leading-6">
                  {stage.actions.map((action) => (
                    <li
                      key={action}
                      className="grid grid-cols-[0.75rem_1fr] gap-2"
                    >
                      <span className="text-muted-foreground" aria-hidden>
                        —
                      </span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
                <p className="bg-muted/50 mt-5 border px-4 py-3 text-sm leading-6">
                  <strong>Ready to move on when:</strong> {stage.checkpoint}
                </p>
              </div>
            </div>
          </section>
        ))}
      </div>
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
        className="scroll-mt-8 border-b py-10"
        aria-labelledby="example-title"
      >
        <p className="text-muted-foreground text-xs font-semibold tracking-[0.15em] uppercase">
          {article.labels.example}
        </p>
        <h2
          id="example-title"
          className="mt-2 text-2xl font-semibold tracking-[-0.025em]"
        >
          {article.example.name}
        </h2>
        <p className="text-muted-foreground mt-4 text-sm leading-6">
          {article.example.context}
        </p>
        <div className="bg-border mt-6 grid gap-px overflow-hidden border sm:grid-cols-2">
          <div className="bg-background p-5">
            <p className="text-muted-foreground text-xs font-semibold uppercase">
              {article.example.weakLabel}
            </p>
            <p className="mt-3 text-sm leading-6">“{article.example.weak}”</p>
          </div>
          <div className="bg-background p-5">
            <p className="text-xs font-semibold uppercase">
              {article.example.strongLabel}
            </p>
            <p className="mt-3 text-sm leading-6">“{article.example.strong}”</p>
          </div>
        </div>
        <p className="text-muted-foreground mt-4 text-sm leading-6">
          {article.example.reason}
        </p>
      </section>

      <section
        id="framework"
        className="scroll-mt-8 border-b py-10"
        aria-labelledby="framework-title"
      >
        <h2
          id="framework-title"
          className="text-2xl font-semibold tracking-[-0.025em]"
        >
          {article.labels.framework}
        </h2>
        <ol className="mt-6 divide-y border-y">
          {article.framework.map((step, index) => (
            <li
              key={step.title}
              className="grid gap-4 py-6 sm:grid-cols-[2rem_1fr]"
            >
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {step.instruction}
                </p>
                <p className="mt-3 text-sm leading-6 italic">
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
        className="scroll-mt-8 border-b py-10"
        aria-labelledby="checklist-title"
      >
        <h2
          id="checklist-title"
          className="text-2xl font-semibold tracking-[-0.025em]"
        >
          {article.labels.checklist}
        </h2>
        <ul className="bg-border mt-6 grid gap-px overflow-hidden border sm:grid-cols-2">
          {article.checklist.map((item) => (
            <li
              key={item}
              className="bg-background grid grid-cols-[1.25rem_1fr] gap-3 p-4 text-sm leading-6"
            >
              <CheckIcon className="mt-1 size-4" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="mistakes"
        className="scroll-mt-8 border-b py-10"
        aria-labelledby="mistakes-title"
      >
        <h2
          id="mistakes-title"
          className="text-2xl font-semibold tracking-[-0.025em]"
        >
          {article.labels.mistakes}
        </h2>
        <dl className="mt-6 divide-y border-y">
          {article.mistakes.map((item) => (
            <div key={item.mistake} className="py-5">
              <dt className="leading-6 font-semibold">{item.mistake}</dt>
              <dd className="text-muted-foreground mt-2 text-sm leading-6">
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
        className="scroll-mt-8 border-b py-10"
        aria-labelledby="measures-title"
      >
        <h2
          id="measures-title"
          className="text-2xl font-semibold tracking-[-0.025em]"
        >
          {article.labels.measures}
        </h2>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          {article.measuresIntroduction}
        </p>
        <ol className="mt-6 space-y-4">
          {article.measures.map((item, index) => (
            <li
              key={item}
              className="grid grid-cols-[2rem_1fr] gap-3 text-sm leading-6"
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
        className="scroll-mt-8 py-10"
        aria-labelledby="sources-title"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.15em] uppercase">
              Primary references
            </p>
            <h2
              id="sources-title"
              className="mt-2 text-2xl font-semibold tracking-[-0.025em]"
            >
              Sources and review
            </h2>
          </div>
          <span className="text-muted-foreground text-xs">
            Reviewed {article.reviewedDate}
          </span>
        </div>
        <ul className="mt-6 divide-y border-y">
          {article.sources.map((source) => (
            <li key={source.url} className="py-5">
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
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {source.note}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground mt-5 text-xs leading-5">
          {article.disclaimer}
        </p>
      </section>
    </>
  )
}
