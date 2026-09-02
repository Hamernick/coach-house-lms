"use client"

import Image from "next/image"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type {
  BrandAssetId,
  BrandIdentityDraft,
  StoredBrandAsset,
} from "../../types"
import { foregroundFor, normalizeHex } from "../../lib/brand-identity"
import { BrandAssetField } from "./brand-asset-field"
import {
  BrandIdentitySection,
  BrandIdentitySubsection,
} from "./brand-identity-section"

export function MarksSection({
  draft,
  assets,
  assetUrls,
  updateDraft,
  uploadAsset,
  deleteAsset,
}: {
  draft: BrandIdentityDraft
  assets: StoredBrandAsset[]
  assetUrls: Partial<Record<BrandAssetId, string>>
  updateDraft: (value: Partial<BrandIdentityDraft>) => void
  uploadAsset: (id: BrandAssetId, file: File) => Promise<boolean>
  deleteAsset: (id: BrandAssetId) => Promise<void>
}) {
  const logo = assets.find((asset) => asset.id === "primary-logo")
  const mark = assets.find((asset) => asset.id === "brand-mark")
  const canvas = normalizeHex(draft.colors[0]?.value ?? "#F3F0E8")
  const brand = normalizeHex(draft.colors[1]?.value ?? "#214E3B")

  return (
    <BrandIdentitySection
      id="marks"
      eyebrow="Recognition"
      title="Marks"
      description="Upload original logo files, document how they should be used, and verify that the mark remains clear across common sizes and backgrounds."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <BrandAssetField
          id="primary-logo"
          label="Primary logo"
          guidance="Use the complete lockup whenever the organization name needs to be clear."
          asset={logo}
          previewUrl={assetUrls["primary-logo"]}
          onUpload={uploadAsset}
          onDelete={deleteAsset}
        />
        <BrandAssetField
          id="brand-mark"
          label="Brand mark"
          guidance="Use the compact mark only when the full logo would be too small to read."
          asset={mark}
          previewUrl={assetUrls["brand-mark"]}
          onUpload={uploadAsset}
          onDelete={deleteAsset}
        />
      </div>

      <div className="mt-8">
        <Label htmlFor="logo-guidance">Usage guidance</Label>
        <Textarea
          id="logo-guidance"
          rows={4}
          className="mt-2"
          value={draft.logoGuidance}
          onChange={(event) =>
            updateDraft({ logoGuidance: event.target.value })
          }
        />
      </div>

      {assetUrls["primary-logo"] ? (
        <>
          <BrandIdentitySubsection
            title="Color versions"
            description="Confirm that the same source artwork remains recognizable on the lightest and darkest approved surfaces."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <LogoPanel
                src={assetUrls["primary-logo"]}
                background={canvas}
                foreground={foregroundFor(canvas)}
                label={`Logo on ${draft.colors[0]?.role ?? "Background"}`}
              />
              <LogoPanel
                src={assetUrls["primary-logo"]}
                background={brand}
                foreground={foregroundFor(brand)}
                label={`Logo on ${draft.colors[1]?.role ?? "Primary"}`}
              />
            </div>
          </BrandIdentitySubsection>
          <BrandIdentitySubsection
            title="Logo scale"
            description="Use the smallest size only when the artwork stays readable. Switch to the compact mark below that threshold."
          >
            <div className="divide-y overflow-hidden rounded-md border">
              {[100, 72, 52, 36, 24].map((size) => (
                <div
                  key={size}
                  className="grid grid-cols-[3.5rem_1fr] items-center px-4 py-5"
                >
                  <span className="text-muted-foreground font-mono text-[0.68rem]">
                    {size}px
                  </span>
                  <div
                    className="relative"
                    style={{ height: Math.max(size, 24) }}
                  >
                    <Image
                      src={assetUrls["primary-logo"] ?? ""}
                      alt=""
                      fill
                      sizes={`${size * 4}px`}
                      className="object-contain object-left"
                      unoptimized
                    />
                  </div>
                </div>
              ))}
            </div>
          </BrandIdentitySubsection>
        </>
      ) : null}
    </BrandIdentitySection>
  )
}

function LogoPanel({
  src,
  background,
  foreground,
  label,
}: {
  src: string
  background: string
  foreground: string
  label: string
}) {
  return (
    <figure>
      <div
        className="relative aspect-square overflow-hidden rounded-md border"
        style={{ backgroundColor: background, color: foreground }}
      >
        <Image
          src={src}
          alt={label}
          fill
          sizes="420px"
          className="object-contain p-[18%]"
          unoptimized
        />
      </div>
      <figcaption className="text-muted-foreground mt-2 text-xs leading-5">
        {label}
      </figcaption>
    </figure>
  )
}
