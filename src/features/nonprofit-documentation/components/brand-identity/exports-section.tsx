"use client"

import { useState } from "react"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import CopyIcon from "lucide-react/dist/esm/icons/copy"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import PrinterIcon from "lucide-react/dist/esm/icons/printer"

import { Button } from "@/components/ui/button"

import type { BrandIdentityDraft, StoredBrandAsset } from "../../types"
import { buildBrandTokens } from "../../lib/brand-identity"
import {
  buildBrandPackage,
  downloadBlob,
} from "../../lib/brand-identity-export"
import { BrandIdentitySection } from "./brand-identity-section"

export function ExportsSection({
  draft,
  assets,
}: {
  draft: BrandIdentityDraft
  assets: StoredBrandAsset[]
}) {
  const [status, setStatus] = useState("Ready to export")
  const [working, setWorking] = useState(false)

  async function downloadPackage() {
    setWorking(true)
    setStatus("Building brand package")
    try {
      const result = await buildBrandPackage(draft, assets)
      downloadBlob(result.blob, result.filename)
      setStatus("Brand package downloaded")
    } catch {
      setStatus("The brand package could not be created")
    } finally {
      setWorking(false)
    }
  }

  async function copyTokens() {
    try {
      await navigator.clipboard.writeText(buildBrandTokens(draft))
      setStatus("CSS tokens copied")
    } catch {
      setStatus("Copy failed. Download the package to get the CSS tokens.")
    }
  }

  return (
    <BrandIdentitySection
      id="exports"
      eyebrow="Portable by default"
      title="Export assets"
      description="Download the entire guide as a portable package. Everything is generated in this browser; Coach House does not receive your files."
      className="border-b-0 pb-24"
    >
      <div className="bg-border grid gap-px overflow-hidden rounded-md border sm:grid-cols-2">
        <div className="bg-background p-6">
          <DownloadIcon className="size-5" aria-hidden />
          <h3 className="mt-5 font-semibold">Complete brand package</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Includes structured brand data, CSS tokens, usage notes, and every
            uploaded original.
          </p>
          <Button
            type="button"
            className="mt-6"
            disabled={working}
            onClick={() => void downloadPackage()}
          >
            <DownloadIcon aria-hidden />
            {working ? "Building package" : "Download ZIP"}
          </Button>
        </div>
        <div className="bg-background p-6">
          <CopyIcon className="size-5" aria-hidden />
          <h3 className="mt-5 font-semibold">Design tokens</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Copy ready-to-use CSS variables for the palette, fonts, and modular
            type scale.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-6"
            onClick={() => void copyTokens()}
          >
            <CopyIcon aria-hidden />
            Copy CSS tokens
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-md border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Printable guide</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Open the browser print view to save a PDF or create a paper copy.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => window.print()}>
          <PrinterIcon aria-hidden />
          Print guide
        </Button>
      </div>

      <div className="mt-8 border-y">
        <div className="grid grid-cols-[1fr_auto] gap-4 py-4 text-sm">
          <span>Brand data and usage notes</span>
          <CheckIcon className="size-4" aria-label="Included" />
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-4 border-t py-4 text-sm">
          <span>CSS color and typography tokens</span>
          <CheckIcon className="size-4" aria-label="Included" />
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-4 border-t py-4 text-sm">
          <span>Uploaded originals</span>
          <span className="text-muted-foreground font-mono text-xs">
            {assets.length} files
          </span>
        </div>
      </div>
      <p
        className="text-muted-foreground mt-5 text-xs"
        role="status"
        aria-live="polite"
      >
        {status}
      </p>
    </BrandIdentitySection>
  )
}
