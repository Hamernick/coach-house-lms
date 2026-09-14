"use client"

import Image from "next/image"

import { Input } from "@/components/ui/input"
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

const ILLUSTRATION_IDS = [1, 2, 3, 4, 5, 6].map(
  (index) => `illustration-${index}` as BrandAssetId
)

export function ApplicationsSection({
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
  const application = assets.find((asset) => asset.id === "application-image")
  const brand = normalizeHex(draft.colors[1]?.value ?? "#214E3B")
  const canvas = normalizeHex(draft.colors[0]?.value ?? "#F3F0E8")
  const ink = normalizeHex(draft.colors[3]?.value ?? "#111310")

  return (
    <BrandIdentitySection
      id="applications"
      eyebrow="Put the system to work"
      title="Applications"
      description="Test the identity in a realistic campaign composition. One message, one focal image, and one clear action are usually enough."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="campaign-headline">Campaign headline</Label>
          <Input
            id="campaign-headline"
            className="mt-2"
            value={draft.campaignHeadline}
            onChange={(event) =>
              updateDraft({ campaignHeadline: event.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="campaign-body">Supporting message</Label>
          <Textarea
            id="campaign-body"
            className="mt-2"
            rows={3}
            value={draft.campaignBody}
            onChange={(event) =>
              updateDraft({ campaignBody: event.target.value })
            }
          />
        </div>
      </div>

      <BrandIdentitySubsection title="Campaign image">
        <BrandAssetField
          id="application-image"
          label="Application image"
          guidance="Choose an image with one clear subject and enough quiet space for text."
          asset={application}
          previewUrl={assetUrls["application-image"]}
          onUpload={uploadAsset}
          onDelete={deleteAsset}
        />
      </BrandIdentitySubsection>

      <BrandIdentitySubsection
        title="Social composition"
        description="Use this as a starting point, then adapt the crop and copy for each channel rather than stretching one file everywhere."
      >
        <div className="overflow-hidden rounded-md border">
          <div className="grid min-h-80 md:grid-cols-2">
            <div
              className="flex flex-col justify-between p-7 sm:p-10"
              style={{ backgroundColor: brand, color: foregroundFor(brand) }}
            >
              <p className="text-sm font-semibold">{draft.organizationName}</p>
              <div>
                <p
                  className="text-3xl leading-tight font-semibold tracking-[-0.04em] sm:text-4xl"
                  style={{ fontFamily: draft.headingFont }}
                >
                  {draft.campaignHeadline}
                </p>
                <p className="mt-4 max-w-sm text-sm leading-6 opacity-80">
                  {draft.campaignBody}
                </p>
              </div>
            </div>
            <div
              className="relative min-h-72"
              style={{ backgroundColor: canvas }}
            >
              {assetUrls["application-image"] ? (
                <Image
                  src={assetUrls["application-image"]}
                  alt="Campaign composition preview"
                  fill
                  sizes="(min-width: 768px) 360px, 100vw"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div
                  className="flex size-full items-end p-8"
                  style={{ color: ink }}
                >
                  <p className="max-w-xs text-sm leading-6">
                    Upload a campaign image to complete this composition.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </BrandIdentitySubsection>

      <BrandIdentitySubsection
        title="Illustrations"
        description="Keep a small, coherent set. Use one drawing style, consistent line weight, and the same approved foreground/background pairings."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ILLUSTRATION_IDS.map((id, index) => (
            <BrandAssetField
              key={id}
              id={id}
              label={`Illustration ${String(index + 1).padStart(2, "0")}`}
              guidance="Optional supporting artwork"
              asset={assets.find((asset) => asset.id === id)}
              previewUrl={assetUrls[id]}
              onUpload={uploadAsset}
              onDelete={deleteAsset}
              aspect="square"
            />
          ))}
        </div>
      </BrandIdentitySubsection>
    </BrandIdentitySection>
  )
}
