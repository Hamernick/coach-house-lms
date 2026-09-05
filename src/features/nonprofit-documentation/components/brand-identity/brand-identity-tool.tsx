"use client"

import Link from "next/link"
import ArrowLeftIcon from "lucide-react/dist/esm/icons/arrow-left"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { DocumentationMobileContents } from "../documentation-contents"

import { useBrandIdentityTool } from "../../hooks/use-brand-identity-tool"
import {
  BRAND_IDENTITY_PATH,
  BRAND_IDENTITY_SECTIONS,
} from "../../lib/brand-identity"
import {
  DocumentationJsonLd,
  DocumentationSurface,
} from "../documentation-surface"
import { ApplicationsSection } from "./applications-section"
import { ExportsSection } from "./exports-section"
import { FoundationSection } from "./foundation-section"
import { MarksSection } from "./marks-section"
import { PaletteSection } from "./palette-section"
import { TypographySection } from "./typography-section"

export function BrandIdentityTool() {
  const tool = useBrandIdentityTool()

  function moveToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    })
    window.history.replaceState(null, "", `#${id}`)
  }

  return (
    <DocumentationSurface className="print:overflow-visible">
      <DocumentationJsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Nonprofit Brand Identity Builder",
          description:
            "A free, editable nonprofit brand guideline builder with local autosave, accessibility checks, and portable exports.",
          applicationCategory: "DesignApplication",
          operatingSystem: "Any",
          url: `https://coachhouse.app${BRAND_IDENTITY_PATH}`,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          publisher: { "@type": "Organization", name: "Coach House" },
        }}
      />
      <div
        id="documentation-content"
        className="mx-auto w-full max-w-[1120px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 print:max-w-none print:p-0"
      >
        <header className="mx-auto max-w-[820px] border-b pb-10 print:pb-6">
          <Link
            href="/documentation"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs font-medium underline-offset-4 hover:underline print:hidden"
          >
            <ArrowLeftIcon className="size-3.5" aria-hidden />
            Documentation
          </Link>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-muted-foreground text-[0.68rem] font-semibold tracking-[0.15em] uppercase">
                Tools · Public tool
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
                Brand Identity Builder
              </h1>
              <p className="text-muted-foreground mt-5 max-w-2xl text-base leading-7 sm:text-lg">
                Build a clear, accessible nonprofit brand system, then download
                everything your team needs to use it consistently.
              </p>
            </div>
            <div className="flex shrink-0 gap-2 print:hidden">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="outline" className="min-h-11">
                    <RotateCcwIcon aria-hidden />
                    Reset
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Start a fresh brand guide?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes the saved text, colors, settings, and
                      uploaded assets from this device. The action cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep guide</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void tool.reset()}>
                      Reset guide
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                type="button"
                className="min-h-11"
                onClick={() => moveToSection("exports")}
              >
                <DownloadIcon aria-hidden />
                Export
              </Button>
            </div>
          </div>
          <div className="text-muted-foreground mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs">
            <span role="status" aria-live="polite">
              {tool.message}
            </span>
            <span>Private to this browser</span>
            <span>No account required</span>
          </div>
        </header>

        <DocumentationMobileContents
          items={BRAND_IDENTITY_SECTIONS.map(
            (section) => [section.id, section.label] as const
          )}
          className="mx-auto max-w-[820px] lg:hidden"
        />

        <div className="mx-auto grid max-w-[960px] gap-14 lg:grid-cols-[140px_minmax(0,760px)] lg:gap-16">
          <aside className="hidden lg:block print:hidden">
            <nav
              aria-label="Brand guide sections"
              className="sticky top-24 pt-10"
            >
              <ol className="space-y-4">
                {BRAND_IDENTITY_SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-muted-foreground hover:text-foreground focus-visible:text-foreground text-xs underline-offset-4 hover:underline"
                    >
                      {section.label}
                    </a>
                  </li>
                ))}
              </ol>
              <div className="text-muted-foreground mt-16 space-y-2 border-t pt-5 text-[0.68rem] leading-5">
                <p>Autosaves on this device.</p>
                <p>Files never leave this browser.</p>
              </div>
            </nav>
          </aside>

          <article className="min-w-0">
            <FoundationSection
              draft={tool.draft}
              updateDraft={tool.updateDraft}
            />
            <MarksSection
              draft={tool.draft}
              assets={tool.assets}
              assetUrls={tool.assetUrls}
              updateDraft={tool.updateDraft}
              uploadAsset={tool.uploadAsset}
              deleteAsset={tool.deleteAsset}
            />
            <PaletteSection draft={tool.draft} updateDraft={tool.updateDraft} />
            <TypographySection
              draft={tool.draft}
              updateDraft={tool.updateDraft}
            />
            <ApplicationsSection
              draft={tool.draft}
              assets={tool.assets}
              assetUrls={tool.assetUrls}
              updateDraft={tool.updateDraft}
              uploadAsset={tool.uploadAsset}
              deleteAsset={tool.deleteAsset}
            />
            <ExportsSection draft={tool.draft} assets={tool.assets} />
          </article>
        </div>
      </div>
    </DocumentationSurface>
  )
}
