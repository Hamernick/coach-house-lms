import Link from "next/link"
import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"
import BookMarkedIcon from "lucide-react/dist/esm/icons/book-marked"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import CompassIcon from "lucide-react/dist/esm/icons/compass"
import LibraryIcon from "lucide-react/dist/esm/icons/library"
import WrenchIcon from "lucide-react/dist/esm/icons/wrench"

import { DOCUMENTATION_NAVIGATION, DOCUMENTATION_PATH } from "../lib"
import {
  DocumentationJsonLd,
  DocumentationSurface,
} from "./documentation-surface"

const stages = [
  { label: "Exploring", copy: "Test the need and the right way to respond." },
  {
    label: "Forming",
    copy: "Build the legal, governance, and operating base.",
  },
  { label: "Operating", copy: "Deliver reliably and learn from evidence." },
  {
    label: "Growing",
    copy: "Expand impact without losing focus or durability.",
  },
]

const concepts = [
  ["Mission", "The contribution your organization exists to make."],
  ["Vision", "The future condition your work helps move toward."],
  ["Program", "An organized set of activities serving the mission."],
  ["Outcome", "A change experienced by people, systems, or communities."],
  [
    "Capacity",
    "The people, systems, money, and relationships available to act.",
  ],
] as const

export function DocumentationHome() {
  const bestPractices = DOCUMENTATION_NAVIGATION.find(
    (section) => section.id === "best-practices"
  )
  const tools = DOCUMENTATION_NAVIGATION.find(
    (section) => section.id === "tools"
  )

  return (
    <DocumentationSurface>
      <DocumentationJsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Coach House Nonprofit Documentation",
          description:
            "Stage-specific guidance for starting and operating sustainable nonprofit organizations in the United States.",
          url: "https://coachhouse.app/documentation",
          isPartOf: {
            "@type": "WebSite",
            name: "Coach House",
            url: "https://coachhouse.app",
          },
        }}
      />
      <div
        id="documentation-content"
        className="mx-auto w-full max-w-[1400px] px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16"
      >
        <header className="max-w-3xl">
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
            Coach House documentation
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">
            Build a nonprofit that can last.
          </h1>
          <p className="text-muted-foreground mt-5 max-w-2xl text-base leading-7 text-pretty sm:text-lg sm:leading-8">
            Clear, stage-specific guidance for starting and operating a
            sustainable nonprofit in the United States—from first evidence to
            durable systems.
          </p>
        </header>

        <section
          id="quickstart"
          aria-labelledby="quickstart-title"
          className="mt-12 overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.85)] dark:bg-zinc-900"
        >
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col justify-between border-b border-zinc-800 p-6 sm:p-8 lg:border-r lg:border-b-0 lg:p-10">
              <div>
                <p className="text-xs font-semibold tracking-[0.15em] text-amber-300 uppercase">
                  Quickstart
                </p>
                <h2
                  id="quickstart-title"
                  className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl"
                >
                  Start with the stage you are actually in.
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-400 sm:text-base sm:leading-7">
                  Nonprofit work is not one checklist. The right next action
                  changes as evidence, obligations, people, and resources grow.
                </p>
              </div>
              <Link
                href={`${DOCUMENTATION_PATH}/quickstart`}
                className="mt-8 inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                Open the quickstart
                <ArrowRightIcon className="size-4" aria-hidden />
              </Link>
            </div>
            <ol className="divide-y divide-zinc-800">
              {stages.map((stage, index) => (
                <li
                  key={stage.label}
                  className="grid grid-cols-[2rem_1fr] gap-3 px-6 py-5 sm:px-8"
                >
                  <span className="font-mono text-xs text-zinc-500">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold">{stage.label}</h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      {stage.copy}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-16" aria-labelledby="paths-title">
          <div className="flex items-end justify-between gap-6 border-b pb-5">
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-[0.15em] uppercase">
                Build paths
              </p>
              <h2
                id="paths-title"
                className="mt-2 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl"
              >
                Guidance for founders and operators
              </h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2">
            <article className="border-b py-7 md:border-r md:pr-8">
              <CompassIcon
                className="text-muted-foreground size-5"
                aria-hidden
              />
              <h3 className="mt-5 text-xl font-semibold">Start a nonprofit</h3>
              <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
                Test the need, choose the right structure, and create a credible
                connection between purpose, activities, governance, and money.
              </p>
              <Link
                href={`${DOCUMENTATION_PATH}/best-practices/mission`}
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
              >
                Define the mission{" "}
                <ArrowRightIcon className="size-4" aria-hidden />
              </Link>
            </article>
            <article className="border-b py-7 md:pl-8">
              <BookMarkedIcon
                className="text-muted-foreground size-5"
                aria-hidden
              />
              <h3 className="mt-5 text-xl font-semibold">
                Strengthen an organization
              </h3>
              <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
                Improve strategic focus, operating systems, evidence, revenue,
                partnerships, and the decisions that protect long-term impact.
              </p>
              <Link
                href={`${DOCUMENTATION_PATH}/best-practices/mission#stages`}
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
              >
                Review stage guidance{" "}
                <ArrowRightIcon className="size-4" aria-hidden />
              </Link>
            </article>
          </div>
        </section>

        <section className="mt-16" aria-labelledby="practices-title">
          <div className="flex items-center gap-3">
            <LibraryIcon className="text-muted-foreground size-5" aria-hidden />
            <h2
              id="practices-title"
              className="text-2xl font-semibold tracking-[-0.025em]"
            >
              Best practices
            </h2>
          </div>
          <div className="mt-6 grid border-t sm:grid-cols-2 lg:grid-cols-4">
            {bestPractices?.items.map((item) => {
              const content = (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold">{item.title}</h3>
                    {item.href ? (
                      <ArrowRightIcon className="size-4 shrink-0" aria-hidden />
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {item.description}
                  </p>
                  {!item.href ? (
                    <span className="text-muted-foreground/70 mt-4 block text-xs">
                      In development
                    </span>
                  ) : null}
                </>
              )

              return item.href ? (
                <Link
                  key={item.title}
                  href={item.href}
                  className="hover:bg-muted/45 focus-visible:bg-muted/45 min-h-40 border-r border-b p-5 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                >
                  {content}
                </Link>
              ) : (
                <article
                  key={item.title}
                  className="min-h-40 border-r border-b p-5"
                >
                  {content}
                </article>
              )
            })}
          </div>
        </section>

        <section
          id="key-concepts"
          className="mt-16 scroll-mt-8"
          aria-labelledby="concepts-title"
        >
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.15em] uppercase">
            Key concepts
          </p>
          <h2
            id="concepts-title"
            className="mt-2 text-2xl font-semibold tracking-[-0.025em]"
          >
            Use precise language
          </h2>
          <Link
            href={`${DOCUMENTATION_PATH}/key-concepts`}
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
          >
            Read all key concepts
            <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
          <dl className="mt-6 divide-y border-y">
            {concepts.map(([term, definition]) => (
              <div
                key={term}
                className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6"
              >
                <dt className="font-semibold">{term}</dt>
                <dd className="text-muted-foreground text-sm leading-6">
                  {definition}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-16" aria-labelledby="tools-title">
          <div className="flex items-center gap-3">
            <WrenchIcon className="text-muted-foreground size-5" aria-hidden />
            <h2
              id="tools-title"
              className="text-2xl font-semibold tracking-[-0.025em]"
            >
              Tools
            </h2>
          </div>
          <div className="mt-6 grid gap-x-8 border-t sm:grid-cols-2 lg:grid-cols-3">
            {tools?.items.map((item) => {
              const content = (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{item.title}</h3>
                    {item.href ? (
                      <ArrowRightIcon className="size-4" aria-hidden />
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {item.description}
                  </p>
                </>
              )

              return item.href ? (
                <Link
                  key={item.title}
                  href={item.href}
                  className="hover:bg-muted/45 focus-visible:bg-muted/45 border-b px-3 py-5 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                >
                  {content}
                </Link>
              ) : (
                <article key={item.title} className="border-b px-3 py-5">
                  {content}
                </article>
              )
            })}
          </div>
        </section>

        <aside
          className="bg-muted/35 mt-16 border p-6 sm:p-8"
          aria-labelledby="editorial-title"
        >
          <CheckCircle2Icon className="text-foreground size-5" aria-hidden />
          <h2 id="editorial-title" className="mt-4 text-xl font-semibold">
            Built to be used and referenced
          </h2>
          <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
            Guidance leads with a direct answer, separates stages, labels
            illustrative examples, and cites primary sources for legal, tax,
            compliance, and financial claims. Each article shows when it was
            reviewed. State-specific requirements should still be confirmed with
            the responsible agency or a qualified professional.
          </p>
        </aside>
      </div>
    </DocumentationSurface>
  )
}
