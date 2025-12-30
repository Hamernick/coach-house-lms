import Link from "next/link"

import { NewsGradientThumb } from "@/components/news/gradient-thumb"
import { PublicHeader } from "@/components/public/public-header"

export const revalidate = 86400

export default function NewsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <div className="mx-auto flex min-h-screen w-[min(1200px,100%)] gap-8 px-4 pb-10 pt-28 md:gap-10">
        {/* Left rail nav */}
        <aside className="sticky top-24 hidden h-[calc(100vh-6rem)] w-40 flex-col justify-between text-xs text-muted-foreground md:flex">
          <div className="space-y-1">
            {[
              { label: "Benefits", href: "/#benefits" },
              { label: "How it works", href: "/#how" },
              { label: "Pricing", href: "/pricing" },
              { label: "News", href: "/news" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`block w-full rounded-md px-2 py-1 text-left hover:text-foreground ${
                  item.label === "News" ? "bg-muted text-foreground" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link href="/" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
            <span aria-hidden>←</span> Home
          </Link>
        </aside>

        {/* Main content */}
        <section className="flex-1">
          <header className="mb-6 text-xs text-muted-foreground">
            <span>Coach House · News</span>
          </header>

          <div className="grid gap-6 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
            {/* Featured story */}
            <article className="space-y-4">
              <Link href="/news/how-we-think-about-AI" className="block">
                <NewsGradientThumb
                  seed="featured-how-we-think-about-ai"
                  className="aspect-[16/9] w-full rounded-3xl shadow-lg"
                />
                <div className="mt-5 space-y-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Product · Oct 21, 2025
                  </p>
                  <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                    How we think about and approach AI for nonprofits
                  </h1>
                  <p className="max-w-xl text-sm text-muted-foreground">
                    AI is math at scale pointed at the hardest part of building a sustainable nonprofit:
                    fundraising, storytelling, and stewardship.
                  </p>
                </div>
              </Link>
            </article>

            {/* Right column cards */}
            <div className="space-y-4">
              <Link
                href="/news/how-we-think-about-AI"
                className="block rounded-3xl border border-border/60 bg-card/60 p-1 shadow-lg"
              >
                <NewsGradientThumb
                  seed="news-safeguards"
                  className="aspect-[4/5] w-full rounded-2xl"
                />
                <div className="mt-3 space-y-1 px-2 pb-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Product · Oct 2025
                  </p>
                  <p className="text-sm font-semibold text-foreground">Introducing accelerator safeguards</p>
                </div>
              </Link>

              <Link
                href="/news/how-we-think-about-AI"
                className="block rounded-3xl border border-border/60 bg-card/60 p-1 shadow-lg"
              >
                <NewsGradientThumb
                  seed="news-sora"
                  className="aspect-[4/5] w-full rounded-2xl"
                />
                <div className="mt-3 space-y-1 px-2 pb-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Story · Sep 2025
                  </p>
                  <p className="text-sm font-semibold text-foreground">Sora 2 is here</p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
